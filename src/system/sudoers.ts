import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { userInfo } from "node:os";
import { join } from "node:path";
import { CLIError } from "../utils/errors.js";
import { exec, spawnInteractive } from "../utils/exec.js";
import { stateDir } from "./state.js";

export const SUDOERS_FILE = "/etc/sudoers.d/awake";
const SUDO = "/usr/bin/sudo";
const VISUDO = "/usr/sbin/visudo";
const PMSET = "/usr/bin/pmset";

export function sudoersRule(): string {
  const user = userInfo().username;
  return `${user} ALL=(root) NOPASSWD: ${PMSET} -a disablesleep 1, ${PMSET} -a disablesleep 0\n`;
}

// The file itself is root-only readable, but /etc/sudoers.d allows stat, so
// existence is a reliable "did you run awake setup" signal. (`sudo -n -l` is
// not: any unrelated NOPASSWD rule makes it pass for every command.)
export function isSudoersConfigured(): boolean {
  return existsSync(SUDOERS_FILE);
}

export async function installSudoersRule(): Promise<void> {
  mkdirSync(stateDir(), { recursive: true });
  const tmp = join(stateDir(), "sudoers.tmp");
  writeFileSync(tmp, sudoersRule(), { mode: 0o644 });

  try {
    const check = await exec(VISUDO, ["-cf", tmp], { allowFailure: true });
    if (check.code !== 0) {
      throw new CLIError(
        `Generated sudoers rule failed validation:\n${check.stderr.trim()}`,
        { code: "sudoers_invalid" },
      );
    }

    // Interactive: sudo prompts for the user's password in the terminal.
    const code = await spawnInteractive(SUDO, [
      "/usr/bin/install",
      "-o",
      "root",
      "-g",
      "wheel",
      "-m",
      "0440",
      tmp,
      SUDOERS_FILE,
    ]);
    if (code !== 0) {
      throw new CLIError("Could not install the sudoers rule.", {
        code: "sudoers_install_failed",
        hint: "make sure your account is an administrator",
      });
    }
  } finally {
    rmSync(tmp, { force: true });
  }

  if (!isSudoersConfigured()) {
    throw new CLIError("Sudoers rule was installed but verification failed.", {
      code: "sudoers_verify_failed",
    });
  }
}

export async function uninstallSudoersRule(): Promise<void> {
  const code = await spawnInteractive(SUDO, ["rm", "-f", SUDOERS_FILE]);
  if (code !== 0) {
    throw new CLIError("Could not remove the sudoers rule.", {
      code: "sudoers_uninstall_failed",
    });
  }
}
