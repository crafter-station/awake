import { isTTY } from "../utils/env.js";

const AWAKE_ASCII = [
  "   █████╗ ██╗    ██╗ █████╗ ██╗  ██╗███████╗",
  "  ██╔══██╗██║    ██║██╔══██╗██║ ██╔╝██╔════╝",
  "  ███████║██║ █╗ ██║███████║█████╔╝ █████╗  ",
  "  ██╔══██║██║███╗██║██╔══██║██╔═██╗ ██╔══╝  ",
  "  ██║  ██║╚███╔███╔╝██║  ██║██║  ██╗███████╗",
  "  ╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝",
].join("\n");

export function getBrandingText(version: string): string {
  if (!isTTY()) return "";

  return [
    "",
    AWAKE_ASCII,
    "",
    `  v${version}  ·  keep your Mac running with the lid closed`,
    "",
  ].join("\n");
}
