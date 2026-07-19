import type { SavedSpec } from "@/lib/db/types";

type RuiInspectorProps = {
  spec: SavedSpec;
};

function hashPrefix(contentHash: string): string {
  const prefix = "sha256:";
  if (contentHash.startsWith(prefix)) {
    return `${prefix}${contentHash.slice(prefix.length, prefix.length + 8)}…`;
  }
  return contentHash.length > 16 ? `${contentHash.slice(0, 16)}…` : contentHash;
}

function OperationsPlaceholder({ rui }: { rui: Record<string, unknown> }) {
  const entities = Array.isArray(rui.entities) ? rui.entities : [];
  const operations = Array.isArray(rui.operations) ? rui.operations : [];
  const transitions = Array.isArray(rui.transitions) ? rui.transitions : [];
  const appTitle =
    rui.app && typeof rui.app === "object" && "title" in rui.app
      ? String((rui.app as { title?: unknown }).title ?? "Untitled")
      : "Untitled";

  return (
    <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-zinc-900">{appTitle}</p>
        <p className="mt-1 text-sm text-zinc-600">
          Operations-first RUI (v0.2). Full operations inspector ships in Phase 5 — showing
          summary counts below.
        </p>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded border border-zinc-100 bg-zinc-50 p-3">
          <dt className="font-medium text-zinc-500">Entities</dt>
          <dd className="mt-1 text-2xl font-semibold">{entities.length}</dd>
        </div>
        <div className="rounded border border-zinc-100 bg-zinc-50 p-3">
          <dt className="font-medium text-zinc-500">Operations</dt>
          <dd className="mt-1 text-2xl font-semibold">{operations.length}</dd>
        </div>
        <div className="rounded border border-zinc-100 bg-zinc-50 p-3">
          <dt className="font-medium text-zinc-500">Transitions</dt>
          <dd className="mt-1 text-2xl font-semibold">{transitions.length}</dd>
        </div>
      </dl>
      {operations.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {operations.slice(0, 8).map((operation, index) => {
            if (!operation || typeof operation !== "object") {
              return null;
            }
            const op = operation as { id?: string; type?: string; title?: string };
            return (
              <li
                key={op.id ?? index}
                className="rounded border border-zinc-100 px-3 py-2 font-mono text-xs"
              >
                <span className="text-violet-700">{op.type ?? "operation"}</span>
                <span className="mx-2 text-zinc-300">·</span>
                <span>{op.title ?? op.id ?? "unnamed"}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export function RuiInspector({ spec }: RuiInspectorProps) {
  const { normalizedRui } = spec;
  const isV02 =
    normalizedRui &&
    typeof normalizedRui === "object" &&
    "version" in normalizedRui &&
    normalizedRui.version === "0.2";

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <h1 className="text-lg font-semibold tracking-tight">RUI Inspector</h1>
          <p className="text-sm text-zinc-500">RapidUI v0.2</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 text-sm">
          <dl className="space-y-1 font-mono text-xs text-zinc-700">
            <div>
              <dt className="inline font-medium text-zinc-500">specId: </dt>
              <dd className="inline">{spec.specId}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-zinc-500">createdAt: </dt>
              <dd className="inline">{spec.createdAt}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-zinc-500">contentHash: </dt>
              <dd className="inline">{hashPrefix(spec.contentHash)}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-zinc-500">validation: </dt>
              <dd className="inline">{spec.validationVersion}</dd>
              <span className="mx-2 text-zinc-300">·</span>
              <dt className="inline font-medium text-zinc-500">registry: </dt>
              <dd className="inline">{spec.registryVersion}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm">
            <span className="font-medium text-zinc-500">API: </span>
            <a
              href={spec.url}
              className="font-mono text-xs underline underline-offset-2"
            >
              {spec.url}
            </a>
          </p>
        </section>

        {isV02 ? (
          <OperationsPlaceholder rui={normalizedRui as Record<string, unknown>} />
        ) : (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Legacy v0.1 block-tree specs are no longer supported in the inspector. Raw JSON is
            available below.
          </section>
        )}

        <details className="rounded-lg border border-zinc-200 bg-white" open>
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700">
            Raw JSON
          </summary>
          <pre className="overflow-x-auto border-t border-zinc-200 p-4 font-mono text-xs text-zinc-800">
            {JSON.stringify(normalizedRui, null, 2)}
          </pre>
        </details>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-sm text-zinc-500">
        rapidui.dev — RUI Inspector
      </footer>
    </div>
  );
}
