# awake - agent contract

`awake` keeps a Mac laptop running with the lid closed. Use it before long unattended tasks (builds, training runs, uploads) when the user asks for the machine to stay up, and turn it off when done.

## Commands

| Command | Purpose | Notes |
| --- | --- | --- |
| `awake on [duration] --json` | Keep the Mac awake | duration: `30m`, `2h`, `1h30m`, bare number = minutes; default `1h`; re-running reschedules the timer |
| `awake on --forever --json` | No auto-off | avoid unless the user explicitly wants it |
| `awake off --json` | Restore normal sleep | idempotent (`reason: "already_off"`) |
| `awake status --json` | Current state | never requires sudo |
| `awake setup --check` | Is passwordless setup done? | exit 0 yes, exit 3 no |

## Output contract

Success (stdout): `{"data": { ... }}`. Error (stderr): `{"error": {"code", "message", "hint"}, "data": null}`.

`awake status --json` data fields: `enabled`, `managed` (enabled by awake vs externally), `forever`, `since`, `until` (ISO 8601 or null), `remaining_seconds`, `battery` (`percent`, `on_ac`, `charging`), `sudoers_configured`.

Exit codes: `0` success, `1` error, `2` usage error, `3` setup required.

## Rules for agents

1. Output is already JSON when piped; passing `--json` anyway is harmless and explicit.
2. Never run `awake setup` yourself - it needs an interactive password prompt. On exit code 3, tell the user to run `awake setup` once in their terminal.
3. Prefer timed sessions sized to the task (for example `awake on 2h` for a long build). The timer restores normal sleep even if you crash before `awake off`.
4. Turn it off (`awake off`) when the task finishes early.
5. Check `battery.on_ac` in status output; warn the user before long awake sessions on battery power.
