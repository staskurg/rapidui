"use client";

type ChatTranscriptLoadErrorBannerProps = {
  onRetry: () => void;
};

export function ChatTranscriptLoadErrorBanner({
  onRetry,
}: ChatTranscriptLoadErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-4 py-8 text-center dark:bg-zinc-950"
    >
      <div className="max-w-md space-y-2 text-ui text-zinc-700 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          Could not load this conversation
        </p>
        <p className="leading-relaxed">
          The transcript store is temporarily unavailable. Your link may still be valid —
          try again in a moment.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-ui font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Retry
      </button>
    </div>
  );
}
