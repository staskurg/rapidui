import type {
  Block,
  Meta,
  Navigation,
  Page,
  Rui,
  Section,
  Table,
} from "@/lib/registry";
import type { SavedSpec } from "@/lib/db/types";

import { BindingChip } from "./BindingChip";
import { getTypeColors } from "./colors";

const TEXT_TRUNCATE_LENGTH = 200;

type RuiInspectorProps = {
  spec: SavedSpec;
};

function truncateText(text: string, max = TEXT_TRUNCATE_LENGTH): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}…`;
}

function hashPrefix(contentHash: string): string {
  const prefix = "sha256:";
  if (contentHash.startsWith(prefix)) {
    return `${prefix}${contentHash.slice(prefix.length, prefix.length + 8)}…`;
  }
  return contentHash.length > 16 ? `${contentHash.slice(0, 16)}…` : contentHash;
}

function BlockShell({
  type,
  id,
  title,
  badge,
  children,
}: {
  type: string;
  id?: string;
  title?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const colors = getTypeColors(type);

  return (
    <div className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
      <div className={`flex flex-wrap items-center gap-2 text-sm font-medium ${colors.text}`}>
        <span>{type}</span>
        {id ? <span className="font-mono text-xs font-normal opacity-80">{id}</span> : null}
        {title ? <span className="font-normal opacity-90">{title}</span> : null}
        {badge}
      </div>
      {children ? <div className="mt-2 space-y-2">{children}</div> : null}
    </div>
  );
}

function DirectionBadge({ direction }: { direction: Section["direction"] }) {
  return (
    <span className="rounded border border-violet-300 bg-violet-50 px-1.5 py-0.5 font-mono text-xs font-normal text-violet-800">
      {direction}
    </span>
  );
}

function ColumnChip({ column }: { column: Table["columns"][number] }) {
  const colors = getTypeColors("column");

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs ${colors.bg} ${colors.border} ${colors.text}`}
    >
      <span>{column.key}</span>
      {column.type ? <span className="opacity-70">({column.type})</span> : null}
    </span>
  );
}

function FilterSummary({ filter }: { filter: NonNullable<Table["filter"]> }) {
  const colors = getTypeColors("filter");

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs ${colors.bg} ${colors.border} ${colors.text}`}
    >
      <span>{filter.field}</span>
      <span className="opacity-70">({filter.options.length} options)</span>
    </span>
  );
}

function UnknownBlock({ block }: { block: Record<string, unknown> }) {
  const type = typeof block.type === "string" ? block.type : "unknown";
  const id = typeof block.id === "string" ? block.id : undefined;

  return (
    <BlockShell type={type} id={id}>
      <pre className="overflow-x-auto rounded border border-gray-200 bg-white/60 p-2 font-mono text-xs text-gray-700">
        {JSON.stringify(block, null, 2)}
      </pre>
    </BlockShell>
  );
}

function TextBlock({ block }: { block: Extract<Block, { type: "Text" }> }) {
  return (
    <BlockShell type="Text" id={block.id}>
      <p className="text-sm text-orange-900">{truncateText(block.content)}</p>
    </BlockShell>
  );
}

function MetricBlock({ block }: { block: Extract<Block, { type: "Metric" }> }) {
  return (
    <BlockShell
      type="Metric"
      id={block.id}
      title={block.label}
      badge={
        block.format ? (
          <span className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 font-mono text-xs font-normal text-emerald-800">
            {block.format}
          </span>
        ) : undefined
      }
    >
      <BindingChip binding={block.binding} />
    </BlockShell>
  );
}

function TableBlock({ block }: { block: Table }) {
  return (
    <BlockShell type="Table" id={block.id} title={block.title}>
      <div className="space-y-2">
        <BindingChip binding={block.binding} />
        <div className="flex flex-wrap gap-1.5">
          {block.columns.map((column) => (
            <ColumnChip key={column.key} column={column} />
          ))}
        </div>
        {block.filter ? <FilterSummary filter={block.filter} /> : null}
      </div>
    </BlockShell>
  );
}

function BlockNode({ block }: { block: Block }) {
  switch (block.type) {
    case "Metric":
      return <MetricBlock block={block} />;
    case "Table":
      return <TableBlock block={block} />;
    case "Text":
      return <TextBlock block={block} />;
    default:
      return <UnknownBlock block={block as unknown as Record<string, unknown>} />;
  }
}

function SectionNode({ section }: { section: Section }) {
  const layoutClass =
    section.direction === "row"
      ? "flex flex-row flex-wrap gap-3"
      : "flex flex-col gap-3";

  return (
    <BlockShell
      type="Section"
      id={section.id}
      title={section.title}
      badge={<DirectionBadge direction={section.direction} />}
    >
      <div className={layoutClass}>
        {section.children.map((block) => (
          <div key={block.id} className={section.direction === "row" ? "min-w-0 flex-1" : undefined}>
            <BlockNode block={block} />
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

function PageNode({ page }: { page: Page }) {
  return (
    <BlockShell type="Page" id={page.id} title={page.title}>
      {page.description ? (
        <p className="text-sm text-blue-900/80">{page.description}</p>
      ) : null}
      <div className="space-y-3">
        {page.children.map((section) => (
          <SectionNode key={section.id} section={section} />
        ))}
      </div>
    </BlockShell>
  );
}

function VersionNode({ version }: { version: string }) {
  const colors = getTypeColors("version");

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm font-medium ${colors.bg} ${colors.border} ${colors.text}`}
    >
      version: {version}
    </div>
  );
}

function MetaNode({ meta }: { meta: Meta }) {
  const colors = getTypeColors("meta");

  return (
    <div className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
      <p className={`text-sm font-medium ${colors.text}`}>Meta</p>
      <dl className="mt-2 space-y-1 text-sm text-gray-800">
        <div>
          <dt className="inline font-medium">title: </dt>
          <dd className="inline">{meta.title}</dd>
        </div>
        {meta.description ? (
          <div>
            <dt className="inline font-medium">description: </dt>
            <dd className="inline">{meta.description}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function NavigationNode({ navigation }: { navigation: Navigation }) {
  const colors = getTypeColors("navigation");

  return (
    <div className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
      <p className={`text-sm font-medium ${colors.text}`}>Navigation</p>
      <ul className="mt-2 space-y-1 text-sm text-slate-800">
        {navigation.items.map((item) => (
          <li key={item.pageId} className="font-mono text-xs">
            {item.label} → {item.pageId}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RuiTree({ rui }: { rui: Rui }) {
  return (
    <div className="space-y-3">
      <VersionNode version={rui.version} />
      <MetaNode meta={rui.meta} />
      <NavigationNode navigation={rui.navigation} />
      <div className="space-y-4">
        {rui.pages.map((page) => (
          <PageNode key={page.id} page={page} />
        ))}
      </div>
    </div>
  );
}

export function RuiInspector({ spec }: RuiInspectorProps) {
  const { normalizedRui } = spec;

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <h1 className="text-lg font-semibold tracking-tight">RUI Inspector</h1>
          <p className="text-sm text-zinc-500">RapidUI v0.1</p>
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

        <RuiTree rui={normalizedRui} />

        <details className="rounded-lg border border-zinc-200 bg-white">
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
