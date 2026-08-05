import { exec } from "../utils/exec.js";

const OSASCRIPT = "/usr/bin/osascript";

export async function notify(title: string, message: string): Promise<void> {
  const script = `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)} sound name "Glass"`;
  await exec(OSASCRIPT, ["-e", script], { allowFailure: true });
}
