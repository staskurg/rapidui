import type { Operation } from "@/lib/operations";

type DataChipProps = {
  data: Operation["data"];
};

export function DataChip({ data }: DataChipProps) {
  if (data.mode === "static") {
    const records = Array.isArray(data.records) ? data.records : [];
    const count = records.length;
    const sampleKeys =
      records[0] && typeof records[0] === "object" && records[0] !== null
        ? Object.keys(records[0] as Record<string, unknown>)
        : [];

    return (
      <div className="space-y-1">
        <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-900">
          static · {count} record{count === 1 ? "" : "s"}
        </span>
        {sampleKeys.length > 0 ? (
          <p className="text-xs text-zinc-700">
            <span className="font-medium text-zinc-600">Record fields: </span>
            {sampleKeys.join(", ")}
          </p>
        ) : null}
      </div>
    );
  }

  const paths: string[] = [];
  if (data.read) {
    paths.push(`${data.read.method} ${data.read.path}`);
  }
  if (data.write) {
    paths.push(`${data.write.method} ${data.write.path}`);
  }

  return (
    <div className="flex flex-wrap gap-1">
      {paths.map((path) => (
        <span
          key={path}
          className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-900"
        >
          api · {path}
        </span>
      ))}
    </div>
  );
}
