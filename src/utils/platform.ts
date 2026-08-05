import { UnsupportedPlatformError } from "./errors.js";

export function requireMacOS(): void {
  if (process.platform !== "darwin") {
    throw new UnsupportedPlatformError();
  }
}
