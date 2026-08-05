import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { CLIError } from "./errors.js";

const execFileAsync = promisify(execFile);

let debugEnabled = false;

export function setDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

function logDebug(message: string): void {
  if (debugEnabled) {
    process.stderr.write(`[debug] ${message}\n`);
  }
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

export async function exec(
  cmd: string,
  args: string[],
  opts?: { allowFailure?: boolean },
): Promise<ExecResult> {
  logDebug(`exec: ${cmd} ${args.join(" ")}`);
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args);
    return { stdout, stderr, code: 0 };
  } catch (error) {
    const e = error as Error & {
      stdout?: string;
      stderr?: string;
      code?: number | string;
    };
    const code = typeof e.code === "number" ? e.code : 1;
    logDebug(`exec failed (${code}): ${(e.stderr || e.message || "").trim()}`);
    if (opts?.allowFailure) {
      return { stdout: e.stdout ?? "", stderr: e.stderr ?? "", code };
    }
    throw new CLIError(
      `Command failed: ${cmd} ${args.join(" ")}\n${(e.stderr || e.message || "").trim()}`,
      { code: "command_failed" },
    );
  }
}

export function spawnInteractive(cmd: string, args: string[]): Promise<number> {
  logDebug(`spawn (interactive): ${cmd} ${args.join(" ")}`);
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}
