import chalk from "chalk";
import { Command } from "commander";
import { cancelAutoOff } from "../system/launchd.js";
import { getBattery, isSleepDisabled } from "../system/pmset.js";
import { clearState, readState } from "../system/state.js";
import { buildStatusPayload } from "../system/statusPayload.js";
import { isSudoersConfigured } from "../system/sudoers.js";
import {
  type GlobalFlags,
  resolveFormat,
} from "../output/formatter.js";
import { printJson } from "../output/json.js";
import { formatClock, formatDuration } from "../utils/duration.js";
import { handleError } from "../utils/errors.js";
import { requireMacOS } from "../utils/platform.js";

export function createStatusCommand(): Command {
  const cmd = new Command("status")
    .description("Show whether the Mac is being kept awake")
    .addHelpText(
      "after",
      `
Examples:
  awake status             # human-readable status
  awake status --json      # agent-friendly: enabled, until, remaining_seconds`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        requireMacOS();
        const enabled = await isSleepDisabled();
        let state = readState();
        const battery = await getBattery();
        const sudoersConfigured = isSudoersConfigured();

        // Self-heal: state file left behind but the switch is off.
        if (!enabled && state) {
          await cancelAutoOff();
          clearState();
          state = null;
        }

        const payload = buildStatusPayload(
          enabled,
          state,
          battery,
          sudoersConfigured,
        );

        if (format === "json") {
          printJson(payload);
          return;
        }

        const until = payload.until ? new Date(payload.until) : null;
        const remainingSeconds = payload.remaining_seconds;
        const { forever } = payload;

        console.log("");
        if (enabled) {
          const detail = forever
            ? "until you turn it off"
            : until && remainingSeconds !== null
              ? `auto-off at ${chalk.bold(formatClock(until))} (${formatDuration(remainingSeconds)} left)`
              : "enabled outside awake (no timer)";
          console.log(
            `  ${chalk.green("●")} awake is ${chalk.green.bold("on")} - ${detail}`,
          );
          if (state?.enabled_at) {
            console.log(
              chalk.dim(`    since ${formatClock(new Date(state.enabled_at))}`),
            );
          }
          if (forever) {
            console.log(
              `    ${chalk.yellow("▲")} no auto-off timer - remember to run ${chalk.bold("awake off")}`,
            );
          }
        } else {
          console.log(
            `  ${chalk.blue("○")} awake is ${chalk.bold("off")} - closing the lid sleeps the Mac normally`,
          );
        }

        if (battery.percent !== null) {
          const source = battery.on_ac ? "AC power" : "battery";
          const chargeNote = battery.charging ? ", charging" : "";
          const line = `    battery ${battery.percent}% (${source}${chargeNote})`;
          if (enabled && !battery.on_ac) {
            console.log(chalk.yellow(line));
          } else {
            console.log(chalk.dim(line));
          }
        }

        if (!sudoersConfigured) {
          console.log(
            `    ${chalk.yellow("▲")} setup needed before toggling works: ${chalk.bold("awake setup")}`,
          );
        }
        console.log("");
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
