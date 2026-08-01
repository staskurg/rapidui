import type { ReactNode } from "react";

type SpecLinkProps = {
  href: string;
  className?: string;
  title?: string;
  children: ReactNode;
};

/** Opens spec / inspector links in a new tab. Uses a native anchor (not Next Link). */
export function SpecLink({ href, className, title, children }: SpecLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} title={title}>
      {children}
    </a>
  );
}
