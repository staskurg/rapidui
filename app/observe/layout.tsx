import { ObserveNav } from "@/components/observe/ObserveNav";

export default function ObserveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <ObserveNav />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
