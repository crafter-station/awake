import { isTTY } from "../utils/env.js";

export type OutputFormat = "json" | "human";

export interface GlobalFlags {
  json?: boolean;
  agent?: boolean;
  quiet?: boolean;
  yes?: boolean;
  debug?: boolean;
}

export function resolveFormat(flags: GlobalFlags): OutputFormat {
  if (flags.agent || flags.json) return "json";
  return isTTY() ? "human" : "json";
}
