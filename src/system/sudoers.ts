import { existsSync } from "node:fs";
import { userInfo } from "node:os";
import { CLIError } from "../utils/errors.js";
import { spawnInteractive } from "../utils/exec.js";

export const SUDOERS_FILE = "/etc/sudoers.d/awake";
const SUDO = "/usr/bin/sudo";
const SH = "/bin/sh";
const RM = "/bin/rm";
const PMSET = "/usr/bin/pmset";

// Runs as root with the rule on stdin. The rule never touches a path the user
// can write to, so nothing can swap it between validation and install. sudo
// ignores dotfiles in /etc/sudoers.d, so the staged file is inert until `mv`
// atomically puts the validated rule in place.
export const INSTALL_SCRIPT = `set -e
umask 077
tmp=$(/usr/bin/mktemp "$(/usr/bin/dirname "$1")/.awake.XXXXXX")
trap '/bin/rm -f "$tmp"' EXIT
/bin/cat > "$tmp"
/usr/sbin/chown root:wheel "$tmp"
/bin/chmod 0440 "$tmp"
/usr/sbin/visudo -cf "$tmp" > /dev/null
/bin/mv -f "$tmp" "$1"
`;

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
  // Interactive: sudo prompts for the user's password on the terminal, not
  // on stdin, so stdin stays free to carry the rule.
  const code = await spawnInteractive(
    SUDO,
    [SH, "-c", INSTALL_SCRIPT, "awake-setup", SUDOERS_FILE],
    { input: sudoersRule() },
  );
  if (code !== 0) {
    throw new CLIError("Could not install the sudoers rule.", {
      code: "sudoers_install_failed",
      hint: "make sure your account is an administrator",
    });
  }

  if (!isSudoersConfigured()) {
    throw new CLIError("Sudoers rule was installed but verification failed.", {
      code: "sudoers_verify_failed",
    });
  }
}

export async function uninstallSudoersRule(): Promise<void> {
  const code = await spawnInteractive(SUDO, [RM, "-f", SUDOERS_FILE]);
  if (code !== 0) {
    throw new CLIError("Could not remove the sudoers rule.", {
      code: "sudoers_uninstall_failed",
    });
  }
}
