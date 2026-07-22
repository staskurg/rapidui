import Link from "next/link";

import { GitHubLink } from "@/components/site/GitHubLink";
import { SiteShell } from "@/components/site/SiteShell";

const agentLinks = [
  {
    href: "/llms.txt",
    label: "GET /llms.txt",
    description: "Discovery index and session instructions — start here",
  },
  {
    href: "/api/docs",
    label: "GET /api/docs",
    description: "Full agent documentation (JSON; requires session header)",
  },
  {
    href: "/api/schema",
    label: "GET /api/schema",
    description: "Operations vocabulary and schema rules (requires session header)",
  },
] as const;

const workflowSteps = [
  {
    title: "Discover",
    body: "Fetch the schema and vocabulary. The agent learns how v0.2 RUIs describe entities, operations, and transitions.",
  },
  {
    title: "Validate",
    body: "Author JSON with version \"0.2\", then validate until valid: true. The platform returns precise errors to fix.",
  },
  {
    title: "Save",
    body: "Persist a validated RUI with POST /api/specs. Review the saved spec in the human inspector at /specs/:id.",
  },
] as const;

export default function Home() {
  return (
    <SiteShell>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-12 sm:py-16">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Agent-first platform · v0.2
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Validate → correct → save RUIs
            </h1>
            <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              RapidUI helps agents produce{" "}
              <strong className="font-medium text-zinc-900 dark:text-zinc-100">
                RUIs
              </strong>{" "}
              — JSON documents that describe operational UI workflows (entities,
              operations, transitions). Not React apps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Build a RUI
            </Link>
            <Link
              href="/observe"
              className="inline-flex items-center rounded-md border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Observe
            </Link>
          </div>

          <p className="text-sm text-zinc-500">
            Agents: start with{" "}
            <Link
              href="/llms.txt"
              className="font-mono font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
            >
              GET /llms.txt
            </Link>{" "}
            — machine-readable discovery is also linked in page metadata.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="for-agents" className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">For agents</h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              RapidUI is designed for programmatic discovery. Fetch{" "}
              <Link href="/llms.txt" className="font-medium underline underline-offset-2">
                /llms.txt
              </Link>{" "}
              first — no session header required. Generate a session id before any
              other API call, then validate and save RUIs via the documented endpoints.
            </p>
          </div>

          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {agentLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="font-mono text-sm font-medium">{link.label}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {link.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Platform
          </h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              <Link
                href="/observe"
                className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
              >
                Observe
              </Link>{" "}
              — API telemetry, agent sessions, and platform analytics
            </p>
            <p>
              <Link
                href="/chat"
                className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
              >
                Build a RUI
              </Link>{" "}
              — chat with the agent, validate in the loop, inspect saved specs
            </p>
          </div>
        </section>

        <section className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
          <p>
            <a
              href="https://github.com/staskurg/rapidui"
              className="font-medium text-zinc-700 underline underline-offset-2 dark:text-zinc-300"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>{" "}
            · see README for local setup
          </p>
          <GitHubLink className="-mr-2 sm:hidden" />
          <p className="hidden sm:block">rapidui.dev · v0.2</p>
        </section>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 sm:hidden">
        rapidui.dev · v0.2
      </footer>
    </SiteShell>
  );
}
