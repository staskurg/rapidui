import type { AssertionResult } from "@/eval/types";

type AssertionResultsTableProps = {
  assertions: AssertionResult[];
};

function formatValue(value: unknown): string {
  if (value === undefined) {
    return "—";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

export function AssertionResultsTable({ assertions }: AssertionResultsTableProps) {
  if (assertions.length === 0) {
    return (
      <p className="text-ui text-zinc-500">No assertion results recorded for this trial.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full text-ui">
        <thead className="bg-zinc-50 dark:bg-zinc-950/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Assertion</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Result</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Expected</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Actual</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {assertions.map((assertion) => (
            <tr
              key={assertion.id}
              className={
                assertion.passed
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-red-50/60 dark:bg-red-950/20"
              }
            >
              <td className="px-4 py-3 font-mono text-caption">{assertion.id}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    assertion.passed
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "font-medium text-red-700 dark:text-red-400"
                  }
                >
                  {assertion.passed ? "Pass" : "Fail"}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-caption text-zinc-600 dark:text-zinc-400">
                {formatValue(assertion.expected)}
              </td>
              <td className="px-4 py-3 font-mono text-caption text-zinc-600 dark:text-zinc-400">
                {formatValue(assertion.actual)}
                {assertion.evidence ? (
                  <span className="mt-1 block text-caption text-zinc-500">
                    {assertion.evidence}
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
