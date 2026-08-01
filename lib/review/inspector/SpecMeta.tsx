import type { SavedSpec } from "@/lib/db/types";

type SpecMetaProps = {
  spec: SavedSpec;
  badge?: "draft" | "saved" | null;
};

function hashPrefix(contentHash: string): string {
  const prefix = "sha256:";
  if (contentHash.startsWith(prefix)) {
    return `${prefix}${contentHash.slice(prefix.length, prefix.length + 8)}…`;
  }
  return contentHash.length > 16 ? `${contentHash.slice(0, 16)}…` : contentHash;
}

export function SpecMeta({ spec, badge }: SpecMetaProps) {
  const isDraft = spec.specId === "draft";

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 text-ui dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-body font-semibold text-zinc-900 dark:text-zinc-100">
          {spec.normalizedRui.app.title}
        </h2>
        {badge === "draft" ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-caption font-medium text-amber-900">
            Draft
          </span>
        ) : null}
        {badge === "saved" ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-caption font-medium text-emerald-900">
            Saved
          </span>
        ) : null}
      </div>

      <dl className="mt-3 space-y-1 font-mono text-caption text-zinc-700 dark:text-zinc-300">
        {!isDraft ? (
          <>
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
          </>
        ) : (
          <div className="text-zinc-500">Draft — not saved yet</div>
        )}
        <div>
          <dt className="inline font-medium text-zinc-500">validation: </dt>
          <dd className="inline">{spec.validationVersion}</dd>
          <span className="mx-2 text-zinc-300">·</span>
          <dt className="inline font-medium text-zinc-500">registry: </dt>
          <dd className="inline">{spec.registryVersion}</dd>
        </div>
      </dl>

      {!isDraft && spec.viewUrl ? (
        <p className="mt-3 text-ui">
          <span className="font-medium text-zinc-500">Share: </span>
          <a
            href={spec.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-caption underline underline-offset-2"
          >
            {spec.viewUrl}
          </a>
        </p>
      ) : null}
    </section>
  );
}
