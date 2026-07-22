import { GITHUB_REPO_URL } from "@/components/site/constants";

type GitHubLinkProps = {
  className?: string;
  label?: string;
};

export function GitHubLink({ className = "", label = "GitHub repository" }: GitHubLinkProps) {
  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5 fill-current"
      >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-1.05-.555-1.125-.96-.015-1.455 1.125-.525 1.815 1.23 2.07 1.755 1.215 2.07 3.165 1.485 3.945 1.125.12-.855.465-1.485.84-1.83-2.925-.33-6.015-1.455-6.015-6.465 0-1.425.51-2.595 1.35-3.51-.135-.33-.585-1.665.135-3.465 0 0 1.11-.345 3.645 1.335 1.05-.285 2.175-.435 3.3-.435 1.125 0 2.25.15 3.3.435 2.535-1.68 3.645-1.335 3.645-1.335.72 1.8.27 3.135.135 3.465.84.915 1.35 2.085 1.35 3.51 0 5.025-3.09 6.135-6.015 6.465.465.405.885 1.185.885 2.385 0 1.725-.015 3.12-.015 3.54 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
      </svg>
    </a>
  );
}
