import chalk from "chalk";
import { Command } from "commander";
import { cancelAutoOff, scheduleAutoOff } from "../system/launchd.js";
import { getBattery, setSleepDisabled } from "../system/pmset.js";
import { writeState } from "../system/state.js";
import {
  type GlobalFlags,
  resolveFormat,
} from "../output/formatter.js";
import { printJson } from "../output/json.js";
import {
  formatClock,
  formatDuration,
  parseDuration,
} from "../utils/duration.js";
import { CLIError, handleError } from "../utils/errors.js";
import { requireMacOS } from "../utils/platform.js";

export function createOnCommand(): Command {
  const cmd = new Command("on")
    .description("Keep the Mac awake with the lid closed (default: 1h)")
    .argument("[duration]", 'How long, e.g. "30m", "2h", "1h30m" (default 1h)')
    .option("--forever", "No auto-off timer (you must run `awake off`)")
    .addHelpText(
      "after",
      `
Examples:
  awake on                 # stay awake for 1 hour
  awake on 3h              # stay awake for 3 hours
  awake on 45m --json      # agent-friendly output
  awake on --forever       # stay awake until awake off`,
    )
    .action(async (durationArg: string | undefined, opts: { forever?: boolean }) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        requireMacOS();
        if (durationArg && opts.forever) {
          throw new CLIError("Pass a duration or --forever, not both.", {
            code: "invalid_arguments",
          });
        }

        const forever = Boolean(opts.forever);
        const durationSeconds = forever
          ? null
          : parseDuration(durationArg ?? "1h");
        const now = new Date();
        const until = durationSeconds
          ? new Date(now.getTime() + durationSeconds * 1000)
          : null;

        await setSleepDisabled(true);
        writeState({
          enabled_at: now.toISOString(),
          until: until ? until.toISOString() : null,
        });

        try {
          if (until) {
            await scheduleAutoOff(until);
          } else {
            await cancelAutoOff();
          }
        } catch (schedulingError) {
          // Never leave the machine sleepless without its safety timer.
          await setSleepDisabled(false);
          throw schedulingError;
        }

        const battery = await getBattery();

        if (format === "json") {
          printJson({
            enabled: true,
            forever,
            until: until ? until.toISOString() : null,
            duration_seconds: durationSeconds,
            battery,
          });
          return;
        }

        console.log("");
        console.log(
          `  ${chalk.green("●")} awake is ${chalk.green.bold("on")} - your Mac will keep running with the lid closed`,
        );
        if (until && durationSeconds) {
          console.log(
            `    auto-off at ${chalk.bold(formatClock(until))} (in ${formatDuration(durationSeconds)})`,
          );
        } else {
          console.log(
            `    ${chalk.yellow("▲")} no auto-off timer - remember to run ${chalk.bold("awake off")}`,
          );
        }
        if (!battery.on_ac && battery.percent !== null) {
          console.log(
            `    ${chalk.yellow("▲")} on battery (${battery.percent}%) - staying awake will drain it faster`,
          );
        }
        console.log(chalk.dim("    turn off early: awake off"));
        console.log("");
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
