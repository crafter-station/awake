import { Command } from "commander";
import { createOffCommand } from "./commands/off.js";
import { createOnCommand } from "./commands/on.js";
import { createSetupCommand } from "./commands/setup.js";
import { createStatusCommand } from "./commands/status.js";
import { type GlobalFlags, resolveFormat } from "./output/formatter.js";
import { getBrandingText } from "./ui/branding.js";
import { isTTY } from "./utils/env.js";
import { handleError } from "./utils/errors.js";
import { setDebug } from "./utils/exec.js";

const VERSION = "0.1.0";

export function createProgram(): Command {
  const program = new Command("awake")
    .version(VERSION, "-v, --version")
    .description(
      "Keep your Mac awake with the lid closed - safe by default, built for humans and agents",
    )
    .option("--json, -j", "Output as JSON (default when piped)")
    .option("--agent", "Agent mode: JSON output, no prompts")
    .option("--quiet, -q", "Suppress decorative output")
    .option("--yes, -y", "Skip confirmations")
    .option("--debug", "Verbose command logging to stderr");

  program.hook("preAction", () => {
    const flags = program.opts() as GlobalFlags;
    setDebug(Boolean(flags.debug));
  });

  program.addCommand(createOnCommand());
  program.addCommand(createOffCommand());
  program.addCommand(createStatusCommand());
  program.addCommand(createSetupCommand());

  program.addHelpText(
    "after",
    `
Run awake <command> --help for detailed usage.

Examples:
  awake setup              # one-time: authorize passwordless toggling
  awake on                 # keep the Mac awake for 1 hour (default)
  awake on 3h              # keep it awake for 3 hours
  awake on --forever       # no timer - until you turn it off
  awake off                # back to normal sleep
  awake status --json      # machine-readable state for agents

Exit codes:
  0  success
  1  error
  3  setup required (run awake setup)`,
  );

  program.action(() => {
    if (isTTY()) {
      process.stdout.write(getBrandingText(VERSION));
    }
    program.outputHelp();
  });

  return program;
}

export async function run(argv?: string[]): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(argv || process.argv);
  } catch (error) {
    const flags = program.opts() as GlobalFlags;
    const format = resolveFormat(flags);
    handleError(error, format);
  }
}
