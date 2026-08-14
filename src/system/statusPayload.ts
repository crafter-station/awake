import type { BatteryInfo } from "./pmset.js";
import type { AwakeState } from "./state.js";

export interface StatusPayload {
  enabled: boolean;
  managed: boolean;
  forever: boolean;
  since: string | null;
  until: string | null;
  remaining_seconds: number | null;
  battery: BatteryInfo;
  sudoers_configured: boolean;
}

// Shared shape for status/on/off JSON output, so the menu bar app can read
// any of those responses as a full status snapshot instead of always
// following up with a separate `status --json` call.
export function buildStatusPayload(
  enabled: boolean,
  state: AwakeState | null,
  battery: BatteryInfo,
  sudoersConfigured: boolean,
): StatusPayload {
  const until = state?.until ? new Date(state.until) : null;
  const remainingSeconds = until
    ? Math.max(0, Math.round((until.getTime() - Date.now()) / 1000))
    : null;

  return {
    enabled,
    managed: enabled && state !== null,
    forever: enabled && state !== null && state.until === null,
    since: state?.enabled_at ?? null,
    until: state?.until ?? null,
    remaining_seconds: remainingSeconds,
    battery,
    sudoers_configured: sudoersConfigured,
  };
}
