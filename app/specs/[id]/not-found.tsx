import Link from "next/link";

export default function SpecInspectorNotFound() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          RUI Inspector
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Spec not found</h1>
        <p className="text-zinc-600">
          No saved RUI exists for this ID, or the ID is invalid.
        </p>
        <Link href="/" className="text-sm font-medium underline underline-offset-2">
          Back to RapidUI
        </Link>
      </main>
    </div>
  );
}
