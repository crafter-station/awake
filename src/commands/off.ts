import chalk from "chalk";
import { Command } from "commander";
import { cancelAutoOff } from "../system/launchd.js";
import { notify } from "../system/notify.js";
import { isSleepDisabled, setSleepDisabled } from "../system/pmset.js";
import { clearState, readState } from "../system/state.js";
import {
  type GlobalFlags,
  resolveFormat,
} from "../output/formatter.js";
import { printJson } from "../output/json.js";
import { handleError } from "../utils/errors.js";
import { requireMacOS } from "../utils/platform.js";

export function createOffCommand(): Command {
  const cmd = new Command("off")
    .description("Restore normal sleep (closing the lid sleeps the Mac)")
    .option("--if-expired", "Only turn off when the auto-off time has passed")
    .addHelpText(
      "after",
      `
Examples:
  awake off            # back to normal sleep behavior
  awake off --json     # agent-friendly output

--if-expired is used internally by the auto-off timer.`,
    )
    .action(async (opts: { ifExpired?: boolean }) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        requireMacOS();
        const state = readState();

        if (opts.ifExpired) {
          const until = state?.until ? new Date(state.until) : null;
          if (!until || Date.now() < until.getTime()) {
            // Timer fired early (RunAtLoad) or state is gone - nothing to do.
            if (format === "json") {
              printJson({ enabled: null, reason: "not_expired" });
            } else {
              console.log("\n  auto-off time has not passed - nothing to do\n");
            }
            return;
          }
        }

        const wasEnabled = await isSleepDisabled();
        if (wasEnabled) {
          await setSleepDisabled(false);
        }
        await cancelAutoOff();
        clearState();

        const reason = opts.ifExpired
          ? "expired"
          : wasEnabled
            ? "manual"
            : "already_off";

        if (opts.ifExpired && wasEnabled) {
          await notify(
            "Awake",
            "Auto-off: your Mac can sleep normally again.",
          );
        }

        if (format === "json") {
          printJson({ enabled: false, was_enabled: wasEnabled, reason });
          return;
        }

        console.log("");
        if (wasEnabled) {
          console.log(
            `  ${chalk.blue("○")} awake is ${chalk.bold("off")} - normal sleep behavior restored`,
          );
        } else {
          console.log(
            `  ${chalk.blue("○")} awake was already off - nothing to do`,
          );
        }
        console.log("");
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
