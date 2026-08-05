import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { CLIError } from "../utils/errors.js";
import { exec } from "../utils/exec.js";
import { logFile } from "./state.js";

const LABEL = "com.crafterstation.awake.autooff";
const LAUNCHCTL = "/bin/launchctl";

function plistPath(): string {
  return join(homedir(), "Library", "LaunchAgents", `${LABEL}.plist`);
}

function xmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// launchd calendar timers fire only at the start of a minute, and a missed
// match never re-fires (the next Month/Day/Hour/Minute match is a year out).
// So schedule the first whole minute at or after `until`; the --if-expired
// guard then sees now >= until and proceeds.
function fireDate(until: Date): Date {
  return new Date(Math.ceil(until.getTime() / 60_000) * 60_000);
}

function buildPlist(until: Date): string {
  // Re-run the exact same runtime + entrypoint that scheduled this job,
  // so it works for `bun run` in dev and the built dist alike.
  const runtime = process.execPath;
  const entry = resolve(process.argv[1] ?? "");
  const log = logFile();
  const fire = fireDate(until);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xmlEscape(runtime)}</string>
    <string>${xmlEscape(entry)}</string>
    <string>off</string>
    <string>--if-expired</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Month</key>
    <integer>${fire.getMonth() + 1}</integer>
    <key>Day</key>
    <integer>${fire.getDate()}</integer>
    <key>Hour</key>
    <integer>${fire.getHours()}</integer>
    <key>Minute</key>
    <integer>${fire.getMinutes()}</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${xmlEscape(log)}</string>
  <key>StandardErrorPath</key>
  <string>${xmlEscape(log)}</string>
</dict>
</plist>
`;
}

function uid(): number {
  return process.getuid?.() ?? 501;
}

export async function scheduleAutoOff(until: Date): Promise<void> {
  const path = plistPath();
  mkdirSync(join(homedir(), "Library", "LaunchAgents"), { recursive: true });
  writeFileSync(path, buildPlist(until));

  await exec(LAUNCHCTL, ["bootout", `gui/${uid()}/${LABEL}`], {
    allowFailure: true,
  });
  const result = await exec(LAUNCHCTL, ["bootstrap", `gui/${uid()}`, path], {
    allowFailure: true,
  });
  if (result.code !== 0) {
    throw new CLIError(
      `Could not schedule the auto-off timer (launchctl exited ${result.code}).`,
      { code: "launchd_failed", hint: "try again, or use awake on --forever" },
    );
  }
}

// Remove the plist BEFORE bootout: when this runs inside the launchd job
// itself (auto-off), bootout kills our own process instantly - anything
// after it never executes. Callers must treat cancelAutoOff() as a
// potential point of no return and do their cleanup first.
export async function cancelAutoOff(): Promise<void> {
  rmSync(plistPath(), { force: true });
  await exec(LAUNCHCTL, ["bootout", `gui/${uid()}/${LABEL}`], {
    allowFailure: true,
  });
}
