import { CLIError } from "./errors.js";

const DURATION_RE = /^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+)s)?$/;
const MAX_SECONDS = 7 * 24 * 60 * 60;

export function parseDuration(input: string): number {
  const trimmed = input.trim().toLowerCase();

  // Bare number means minutes: `awake on 45` == `awake on 45m`
  if (/^\d+$/.test(trimmed)) {
    return validate(Number(trimmed) * 60, input);
  }

  const match = trimmed.match(DURATION_RE);
  if (!match || (!match[1] && !match[2] && !match[3])) {
    throw new CLIError(`Invalid duration: "${input}"`, {
      code: "invalid_duration",
      hint: 'try "30m", "2h", "1h30m", or "45" (minutes)',
    });
  }

  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = match[2] ? Number(match[2]) : 0;
  const seconds = match[3] ? Number(match[3]) : 0;
  return validate(Math.round(hours * 3600 + minutes * 60 + seconds), input);
}

function validate(seconds: number, input: string): number {
  if (seconds <= 0) {
    throw new CLIError(`Duration must be positive: "${input}"`, {
      code: "invalid_duration",
      hint: 'try "30m", "2h", or "1h30m"',
    });
  }
  if (seconds > MAX_SECONDS) {
    throw new CLIError(`Duration too long: "${input}" (max 7d)`, {
      code: "invalid_duration",
      hint: "use --forever if you really want no auto-off",
    });
  }
  return seconds;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && hours === 0) parts.push(`${secs}s`);
  if (parts.length === 0) parts.push("0s");
  return parts.join(" ");
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
