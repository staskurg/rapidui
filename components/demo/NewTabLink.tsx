import type { ReactNode } from "react";

type NewTabLinkProps = {
  href: string;
  className?: string;
  title?: string;
  "aria-label"?: string;
  children: ReactNode;
};

/** Opens in a new tab. Uses a native anchor (not Next Link) so the router cannot hijack the click. */
export function NewTabLink({
  href,
  className,
  title,
  "aria-label": ariaLabel,
  children,
}: NewTabLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
