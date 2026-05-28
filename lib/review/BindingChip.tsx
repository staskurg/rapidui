import type { ReadBinding } from "@/lib/registry";

import { TYPE_COLORS } from "./colors";

type BindingChipProps = {
  binding: ReadBinding;
};

export function BindingChip({ binding }: BindingChipProps) {
  const colors = TYPE_COLORS.binding;

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs ${colors.bg} ${colors.border} ${colors.text}`}
    >
      <span>{binding.method}</span>
      <span>{binding.path}</span>
      {binding.valuePath ? (
        <>
          <span aria-hidden="true">→</span>
          <span>{binding.valuePath}</span>
        </>
      ) : null}
    </span>
  );
}
