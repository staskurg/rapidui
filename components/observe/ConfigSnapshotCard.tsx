import type { EvalTrialRecord } from "@/lib/db/evalTrials";
import { configSnapshotFields } from "@/lib/eval/configDisplay";

type ConfigSnapshotCardProps = {
  trial: EvalTrialRecord;
};

function SnapshotRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-caption font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 break-all font-mono text-ui">{value ?? "—"}</dd>
    </div>
  );
}

export function ConfigSnapshotCard({ trial }: ConfigSnapshotCardProps) {
  const fields = configSnapshotFields(trial);

  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map((field) => (
        <SnapshotRow key={field.label} label={field.label} value={field.value} />
      ))}
    </dl>
  );
}
