"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type NewTabLinkProps = {
  href: string;
  className?: string;
  title?: string;
  children: ReactNode;
};

/** Opens in a new tab — explicit window.open for browsers that ignore target="_blank". */
export function NewTabLink({ href, className, title, children }: NewTabLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={title}
      onClick={(event) => {
        event.preventDefault();
        window.open(href, "_blank", "noopener,noreferrer");
      }}
    >
      {children}
    </Link>
  );
}
