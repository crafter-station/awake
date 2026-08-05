import { createInterface } from "node:readline/promises";
import chalk from "chalk";
import { Command } from "commander";
import {
  SUDOERS_FILE,
  installSudoersRule,
  isSudoersConfigured,
  sudoersRule,
  uninstallSudoersRule,
} from "../system/sudoers.js";
import {
  type GlobalFlags,
  resolveFormat,
} from "../output/formatter.js";
import { printJson } from "../output/json.js";
import { isTTY } from "../utils/env.js";
import { CLIError, handleError } from "../utils/errors.js";
import { requireMacOS } from "../utils/platform.js";

export function createSetupCommand(): Command {
  const cmd = new Command("setup")
    .description("One-time setup: authorize passwordless sleep toggling")
    .option("--check", "Report setup state without changing anything")
    .option("--uninstall", "Remove the sudoers rule installed by setup")
    .addHelpText(
      "after",
      `
Setup installs ${SUDOERS_FILE} so awake can run exactly these two commands
without a password prompt (and nothing else):

  pmset -a disablesleep 1
  pmset -a disablesleep 0

Examples:
  awake setup              # interactive, asks for your password once
  awake setup --check      # exit 0 if configured, exit 3 if not
  awake setup --uninstall  # remove the rule`,
    )
    .action(async (opts: { check?: boolean; uninstall?: boolean }) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        requireMacOS();
        const configured = isSudoersConfigured();

        if (opts.check) {
          if (format === "json") {
            printJson({ configured });
          } else {
            console.log(
              configured
                ? `\n  ${chalk.green("●")} setup complete - awake can toggle without a password\n`
                : `\n  ${chalk.yellow("▲")} not configured - run ${chalk.bold("awake setup")}\n`,
            );
          }
          process.exit(configured ? 0 : 3);
        }

        if (opts.uninstall) {
          await uninstallSudoersRule();
          if (format === "json") {
            printJson({ configured: false, uninstalled: true });
          } else {
            console.log(
              `\n  ${chalk.blue("○")} removed ${SUDOERS_FILE} - awake will now require setup again\n`,
            );
          }
          return;
        }

        if (configured) {
          if (format === "json") {
            printJson({ configured: true, already_configured: true });
          } else {
            console.log(
              `\n  ${chalk.green("●")} already configured - nothing to do\n`,
            );
          }
          return;
        }

        if (!isTTY()) {
          throw new CLIError(
            "Setup needs an interactive terminal to ask for your password once.",
            {
              code: "tty_required",
              hint: "run `awake setup` yourself in a terminal",
            },
          );
        }

        console.log("");
        console.log(`  awake setup will install ${chalk.bold(SUDOERS_FILE)}:`);
        console.log("");
        console.log(chalk.dim(`    ${sudoersRule().trim()}`));
        console.log("");
        console.log(
          "  This allows exactly those two pmset commands to run without a",
        );
        console.log(
          "  password - nothing else gets elevated. You can undo it anytime",
        );
        console.log(`  with ${chalk.bold("awake setup --uninstall")}.`);
        console.log("");

        if (!globals.yes) {
          const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
          });
          const answer = await rl.question("  Continue? [y/N] ");
          rl.close();
          if (!/^y(es)?$/i.test(answer.trim())) {
            console.log("\n  aborted - nothing was changed\n");
            return;
          }
        }

        console.log("");
        await installSudoersRule();

        if (format === "json") {
          printJson({ configured: true });
        } else {
          console.log(
            `\n  ${chalk.green("●")} setup complete - try it: ${chalk.bold("awake on 30m")}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
