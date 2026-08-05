export function isTTY(): boolean {
  return Boolean(process.stdout.isTTY);
}

export function isCI(): boolean {
  return Boolean(
    process.env.CI || process.env.GITHUB_ACTIONS || process.env.GITLAB_CI,
  );
}

export function isAgentMode(flags: {
  json?: boolean;
  agent?: boolean;
}): boolean {
  if (flags.agent || flags.json) return true;
  if (!isTTY()) return true;
  return false;
}

export function shouldShowUI(flags: {
  json?: boolean;
  agent?: boolean;
  quiet?: boolean;
}): boolean {
  if (flags.quiet || flags.agent || flags.json) return false;
  if (!isTTY()) return false;
  if (isCI()) return false;
  return true;
}
