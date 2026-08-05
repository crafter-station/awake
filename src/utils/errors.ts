import chalk from "chalk";
import type { OutputFormat } from "../output/formatter.js";
import { printJsonError } from "../output/json.js";

export class CLIError extends Error {
  public readonly exitCode: number;
  public readonly code: string;
  public readonly hint?: string;

  constructor(
    message: string,
    opts?: { exitCode?: number; code?: string; hint?: string },
  ) {
    super(message);
    this.name = "CLIError";
    this.exitCode = opts?.exitCode ?? 1;
    this.code = opts?.code ?? "cli_error";
    this.hint = opts?.hint;
  }
}

export class SetupRequiredError extends CLIError {
  constructor() {
    super(
      "Passwordless toggling is not configured. Run `awake setup` once to authorize awake to flip the sleep switch without a password prompt.",
      { exitCode: 3, code: "setup_required", hint: "awake setup" },
    );
  }
}

export class UnsupportedPlatformError extends CLIError {
  constructor() {
    super("awake only works on macOS (it drives `pmset disablesleep`).", {
      exitCode: 1,
      code: "unsupported_platform",
    });
  }
}

export function handleError(error: unknown, format: OutputFormat): never {
  if (error instanceof CLIError) {
    if (format === "json") {
      printJsonError(error.code, error.message, error.hint);
    } else {
      console.error(`\n  ${chalk.red("error")} ${error.message}`);
      if (error.hint) {
        console.error(`  ${chalk.dim(`hint: ${error.hint}`)}`);
      }
      console.error();
    }
    process.exit(error.exitCode);
  }

  const message = error instanceof Error ? error.message : String(error);
  if (format === "json") {
    printJsonError("unexpected_error", message);
  } else {
    console.error(`\n  ${chalk.red("error")} ${message}\n`);
  }

  process.exit(1);
}
