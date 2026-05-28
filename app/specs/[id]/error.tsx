"use client";

type SpecInspectorErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SpecInspectorError({ reset }: SpecInspectorErrorProps) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          RUI Inspector
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Store unavailable</h1>
        <p className="text-zinc-600">
          The RUI store is temporarily unavailable. Please try again later.
        </p>
        <button
          type="button"
          onClick={reset}
          className="w-fit rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50"
        >
          Try again
        </button>
      </main>
    </div>
  );
}
