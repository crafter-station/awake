# @crafter/awake

## 0.2.0

### Minor Changes

- feat(system): unify on/off/status JSON payload — `on --json` and `off --json` now return the same full status snapshot as `status --json` (plus their own extra fields), so consumers like the menu bar app no longer need a follow-up `status` call ([#1](https://github.com/crafter-station/awake/pull/1))
- feat(mac): menu bar app decodes the on/off command's own JSON reply directly, halving CLI subprocess spawns per click; refresh poll widened 30s → 60s and the forever-mode reminder 30min → 1h ([#2](https://github.com/crafter-station/awake/pull/2))
- feat(mac): add "Keep awake 4 hours" and "8 hours" presets to the menu bar dropdown ([#3](https://github.com/crafter-station/awake/pull/3))

### Patch Changes

- fix(system): don't report a discharging battery as charging — the state detection anchored to pmset's `; ` separator so `discharging` / `not charging` no longer substring-match ([#5](https://github.com/crafter-station/awake/pull/5))

## 0.1.0

Initial release: `awake on/off/status/setup` CLI with pmset-based sleep control, launchd auto-off timer, sudoers setup, JSON output for agents, and the AwakeBar menu bar app.
