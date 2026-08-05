import { CopyCommand } from "@/components/copy-command";
import { GithubStars } from "@/components/github-stars";
import { ThemeToggle } from "@/components/theme-toggle";
import { githubUrl, npmUrl } from "@/lib/seo";

const COMMANDS: Array<[string, string]> = [
  ["awake on", "keep the Mac awake for 1 hour (the safe default)"],
  ["awake on 3h", "durations: 30m, 2h, 1h30m, bare numbers are minutes"],
  ["awake on --forever", "no timer, stays on until you turn it off"],
  ["awake off", "restore normal sleep now"],
  ["awake status", "state, timer, battery, one glance"],
  ["awake setup", "one-time: authorize passwordless toggling"],
];

const FEATURES: Array<[string, string]> = [
  [
    "auto-off by default",
    "Every session gets a timer backed by launchd. A forgotten toggle restores normal sleep on its own, even after a crash or reboot.",
  ],
  [
    "scoped sudo, once",
    "Setup installs a sudoers rule for exactly two pmset commands. Nothing else gets elevated, and uninstall removes it.",
  ],
  [
    "visible state",
    "The menu bar shows a sun with a live countdown while active, and you get a notification when auto-off fires.",
  ],
  [
    "built for agents",
    "Stable JSON envelopes, meaningful exit codes, an AGENTS.md contract. Your coding agent can run it before long jobs.",
  ],
];

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col border-x">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h1 className="font-mono text-sm font-semibold tracking-tight">
            awake
            <span className="text-muted-foreground">.crafter.run</span>
          </h1>
          <p className="mt-0.5 hidden font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground sm:block">
            lid closed · Mac running
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <GithubStars />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b px-4 py-12 sm:py-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            macOS 13+ · free · MIT
          </p>
          <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Keep your Mac awake with the lid closed.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            macOS force-sleeps a laptop the moment the lid closes, no matter
            what caffeinate says. awake wraps the one switch that overrides it
            with the guardrails it deserves: a CLI and a menu bar app, safe by
            default, built for humans and AI agents.
          </p>
          <div className="mt-6 max-w-xl space-y-2">
            <CopyCommand command="npm install -g @crafter/awake" />
            <CopyCommand command="awake setup && awake on 2h" />
          </div>
        </section>

        <section className="border-b px-4 py-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            in the terminal
          </p>
          <pre className="mt-3 overflow-x-auto border bg-card p-4 font-mono text-xs leading-relaxed">
            <code>
              <span className="text-muted-foreground">$ </span>awake on 2h
              {"\n\n"}
              {"  "}● awake is on - your Mac will keep running with the lid
              closed{"\n"}
              {"    "}auto-off at 6:45 PM (in 2h){"\n"}
              <span className="text-muted-foreground">
                {"    "}turn off early: awake off
              </span>
              {"\n\n"}
              <span className="text-muted-foreground">$ </span>awake status
              --json{"\n"}
              <span className="text-muted-foreground">
                {'{ "data": { "enabled": true, "remaining_seconds": 7134, '}
                {'"battery": { "percent": 82, "on_ac": true } } }'}
              </span>
            </code>
          </pre>
        </section>

        <section className="border-b">
          <div className="grid sm:grid-cols-2">
            {FEATURES.map(([title, body], i) => (
              <div
                key={title}
                className={[
                  "p-4",
                  i % 2 === 0 ? "sm:border-r" : "",
                  i < 2 ? "border-b" : "",
                  i === 2 ? "border-b sm:border-b-0" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <h3 className="font-mono text-[10px] uppercase tracking-[0.12em]">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b px-4 py-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            commands
          </p>
          <div className="mt-3 border">
            {COMMANDS.map(([cmd, desc], i) => (
              <div
                key={cmd}
                className={`flex flex-col gap-1 p-3 sm:flex-row sm:items-baseline sm:gap-4 ${i > 0 ? "border-t" : ""}`}
              >
                <code className="shrink-0 font-mono text-xs sm:w-44">
                  {cmd}
                </code>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b px-4 py-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            for ai agents
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Output is JSON automatically when piped. Success is{" "}
            <code className="font-mono text-xs text-foreground">
              {'{ "data": ... }'}
            </code>{" "}
            on stdout, errors are{" "}
            <code className="font-mono text-xs text-foreground">
              {'{ "error": { "code", "message", "hint" } }'}
            </code>{" "}
            on stderr. Exit codes: 0 success, 1 error, 3 setup required. A
            Claude Code agent can run{" "}
            <code className="font-mono text-xs text-foreground">
              awake on 2h
            </code>{" "}
            before a long build and{" "}
            <code className="font-mono text-xs text-foreground">awake off</code>{" "}
            when it finishes early, and the timer covers the crash case. The
            full contract lives in{" "}
            <a
              href={`${githubUrl}/blob/main/AGENTS.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              AGENTS.md
            </a>
            .
          </p>
        </section>

        <section className="border-b px-4 py-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            how it works
          </p>
          <ol className="mt-3 max-w-xl space-y-3">
            {[
              [
                "01",
                "awake on flips pmset disablesleep, the only switch that survives a closed lid. Setup authorizes exactly that command pair through /etc/sudoers.d/awake, nothing else.",
              ],
              [
                "02",
                "A launchd agent runs awake off just past the deadline, and again at login in case the deadline passed while the machine was off.",
              ],
              [
                "03",
                "The menu bar app and the CLI share one source of truth, so they can never disagree about whether your Mac is being kept awake.",
              ],
            ].map(([n, body]) => (
              <li key={n} className="flex gap-4">
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {n}
                </span>
                <span className="text-sm text-muted-foreground">{body}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-xl border bg-card p-3 text-xs text-muted-foreground">
            Heads up: with awake on, a Mac in a closed bag keeps running and
            keeps making heat. That is exactly why the default is a one-hour
            timer, the status warns on battery power, and the menu bar never
            hides the state.
          </p>
        </section>
      </main>

      <footer className="flex items-center justify-between gap-3 px-4 py-4">
        <a
          href="https://crafterstation.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest">
            Crafter Station
          </span>
        </a>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href={npmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            npm
          </a>
          <span>MIT</span>
        </div>
      </footer>
    </div>
  );
}
