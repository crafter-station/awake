import { githubUrl, npmUrl, siteUrl } from "@/lib/seo";

export const revalidate = false;

const content = `# awake

> Keep a Mac laptop running with the lid closed. A macOS CLI + menu bar app
> that wraps \`pmset disablesleep\` (the only switch that survives a closed
> lid; caffeinate does not) with safety guardrails: an auto-off timer by
> default, a sudoers rule scoped to exactly two commands, visible menu bar
> state, and JSON output for agents.

Install: \`npm install -g @crafter/awake\` (macOS 13+, MIT, free)
One-time setup: \`awake setup\` (interactive, asks for the user password once)

## Commands

- \`awake on [duration]\`: keep the Mac awake; default 1h; durations like 30m, 2h, 1h30m, bare number = minutes; re-running reschedules the timer
- \`awake on --forever\`: no auto-off timer
- \`awake off\`: restore normal sleep now (idempotent)
- \`awake status\`: current state, timer, battery
- \`awake setup --check\`: exit 0 if configured, exit 3 if not

## Agent contract

- Output is JSON automatically when piped; \`--json\` forces it
- Success envelope on stdout: {"data": {...}}
- Error envelope on stderr: {"error": {"code", "message", "hint"}, "data": null}
- Exit codes: 0 success, 1 error, 2 usage, 3 setup required (a human must run \`awake setup\` once)
- \`awake status --json\` data fields: enabled, managed, forever, since, until (ISO 8601), remaining_seconds, battery {percent, on_ac, charging}, sudoers_configured
- Never run \`awake setup\` from an agent; on exit 3, ask the human
- Prefer timed sessions sized to the task; the timer restores sleep even if the agent crashes

## How it works

1. \`awake on\` runs \`sudo -n pmset -a disablesleep 1\`, allowed passwordless by /etc/sudoers.d/awake (scoped to that exact command pair)
2. A launchd agent (com.crafterstation.awake.autooff) runs \`awake off --if-expired\` just past the deadline, and at login in case the deadline passed while the machine was off
3. The SwiftUI menu bar app polls \`awake status --json\` and shells out to the same CLI, so both surfaces agree

## Links

- [Website](${siteUrl})
- [GitHub](${githubUrl})
- [npm](${npmUrl})
- [Agent contract](${githubUrl}/blob/main/AGENTS.md)
`;

export function GET() {
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
