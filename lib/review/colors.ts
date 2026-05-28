/** Fixed pastel palette keyed by node kind — same type → same color across all specs. */
export type TypeColorClasses = {
  bg: string;
  border: string;
  text?: string;
};

export const TYPE_COLORS: Record<string, TypeColorClasses> = {
  version: { bg: "bg-zinc-100", border: "border-zinc-300", text: "text-zinc-800" },
  meta: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-800" },
  navigation: { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-800" },
  Page: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-900" },
  Section: { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-900" },
  Metric: { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-900" },
  Text: { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-900" },
  Table: { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-900" },
  binding: { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-900" },
  column: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
  filter: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
  unknown: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-700" },
};

export function getTypeColors(type: string): TypeColorClasses {
  return TYPE_COLORS[type] ?? TYPE_COLORS.unknown;
}
