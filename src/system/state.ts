import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface AwakeState {
  enabled_at: string;
  until: string | null;
}

export function stateDir(): string {
  return join(homedir(), "Library", "Application Support", "awake");
}

export function logFile(): string {
  return join(stateDir(), "awake.log");
}

function stateFile(): string {
  return join(stateDir(), "state.json");
}

export function readState(): AwakeState | null {
  try {
    const raw = readFileSync(stateFile(), "utf8");
    const parsed = JSON.parse(raw) as AwakeState;
    if (typeof parsed.enabled_at !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeState(state: AwakeState): void {
  mkdirSync(stateDir(), { recursive: true });
  writeFileSync(stateFile(), `${JSON.stringify(state, null, 2)}\n`);
}

export function clearState(): void {
  rmSync(stateFile(), { force: true });
}
