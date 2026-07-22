/** Fixed pastel palette keyed by operation type or transition trigger. */
export type TypeColorClasses = {
  bg: string;
  border: string;
  text: string;
};

export const OPERATION_TYPE_COLORS: Record<string, TypeColorClasses> = {
  browse: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-900" },
  read: { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-900" },
  create: { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-900" },
  update: { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-900" },
  delete: { bg: "bg-red-100", border: "border-red-300", text: "text-red-900" },
  unknown: { bg: "bg-zinc-100", border: "border-zinc-300", text: "text-zinc-800" },
};

export const TRANSITION_TRIGGER_COLORS: Record<string, TypeColorClasses> = {
  row: { bg: "bg-sky-100", border: "border-sky-300", text: "text-sky-900" },
  link: { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-900" },
  cta: { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-900" },
  cancel: { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-900" },
  unknown: { bg: "bg-zinc-100", border: "border-zinc-300", text: "text-zinc-800" },
};

export function getOperationTypeColors(type: string): TypeColorClasses {
  return OPERATION_TYPE_COLORS[type] ?? OPERATION_TYPE_COLORS.unknown;
}

export function getTransitionTriggerColors(trigger: string): TypeColorClasses {
  return TRANSITION_TRIGGER_COLORS[trigger] ?? TRANSITION_TRIGGER_COLORS.unknown;
}
