import Link from "next/link";

type ObserveNoticeBannerProps = {
  title: string;
  message: string;
  dismissHref?: string;
};

export function ObserveNoticeBanner({ title, message, dismissHref }: ObserveNoticeBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-ui text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 leading-relaxed text-amber-900/90 dark:text-amber-200/90">
            {message}
          </p>
        </div>
        {dismissHref ? (
          <Link
            href={dismissHref}
            className="shrink-0 text-caption font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950 dark:text-amber-200 dark:hover:text-amber-50"
          >
            Dismiss
          </Link>
        ) : null}
      </div>
    </div>
  );
}
