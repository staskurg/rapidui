import Link from "next/link";

const agentLinks = [
  { href: "/llms.txt", label: "llms.txt", description: "Agent discovery index" },
  { href: "/api/docs", label: "/api/docs", description: "Full agent documentation (JSON)" },
  { href: "/api/schema", label: "/api/schema", description: "Operations vocabulary and schema rules" },
  {
    href: "/api/validate",
    label: "POST /api/validate",
    description: "Validate a RUI — retry on errors[] until valid: true",
  },
  {
    href: "/api/specs",
    label: "POST /api/specs",
    description: "Persist validated RUI — returns 201 flat SavedSpec",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-16">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            RapidUI v0.1
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Validate → correct → save RUIs
          </h1>
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            RapidUI is an agent-first platform for{" "}
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">
              RUIs
            </strong>{" "}
            — JSON documents that describe app screens, blocks, and bindings. Not
            React apps.
          </p>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Status
          </h2>
          <div className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              <Link
                href="/api/health"
                className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
              >
                GET /api/health
              </Link>{" "}
              — platform health check
            </p>
            <p>
              <Link
                href="/observe"
                className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
              >
                Observe
              </Link>{" "}
              — API telemetry, sessions, and platform analytics
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">For agents</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Start with{" "}
            <Link href="/llms.txt" className="font-medium underline underline-offset-2">
              GET /llms.txt
            </Link>{" "}
            — no need to parse this page.
          </p>
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

        <section className="space-y-2">
          <h2 className="text-xl font-semibold">For developers</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <a
              href="https://github.com/staskurg/rapidui"
              className="font-medium underline underline-offset-2"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>{" "}
            · see README for local setup
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        rapidui.dev — v0.1
      </footer>
    </div>
  );
}
