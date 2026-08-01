import Link from "next/link";

import { getEvalTeaser } from "@/lib/observe/queries";

export const dynamic = "force-dynamic";

export default async function EvalsObservePlaceholderPage() {
  const evalTeaser = await getEvalTeaser();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Eval lab</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Model × prompt × use-case comparison ships in Phase 7.6–7.7. Script-driven via{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
            npm run eval:run
          </code>{" "}
          and{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
            npm run eval:matrix
          </code>
          .
        </p>
      </header>

      <section className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Coming in Phase 7
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Grouped comparison table: model, prompt version, eval mode, case id</li>
          <li>Pass rate, avg validate retries, avg tokens, avg latency</li>
          <li>Estimated cost per successful save</li>
          <li>Drill-down to individual runs joined by session id</li>
        </ul>
      </section>

      {evalTeaser.totalRuns > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Eval runs teaser</h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Eval case</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Passed</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {evalTeaser.caseBreakdown.map((row) => (
                  <tr key={row.evalCaseId}>
                    <td className="px-4 py-3 font-mono text-xs">{row.evalCaseId}</td>
                    <td className="px-4 py-3 text-right">{row.passed}</td>
                    <td className="px-4 py-3 text-right text-zinc-500">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {evalTeaser.overallPassRate !== null ? (
            <p className="text-sm text-zinc-500">
              Overall pass rate: {evalTeaser.overallPassRate}% ({evalTeaser.totalRuns} runs)
            </p>
          ) : null}
        </section>
      ) : null}

      <Link
        href="/observe/api"
        className="inline-flex text-sm font-medium text-violet-700 hover:text-violet-900 dark:text-violet-400"
      >
        View API sessions →
      </Link>
    </div>
  );
}
