type ObserveNavIconProps = {
  name: "overview" | "api" | "agent" | "evals" | "telemetry";
  className?: string;
};

export function ObserveNavIcon({ name, className = "h-4 w-4 shrink-0" }: ObserveNavIconProps) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "overview":
      return (
        <svg {...shared}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "api":
      return (
        <svg {...shared}>
          <path d="M8 9 4 12l4 3" />
          <path d="m16 9 4 3-4 3" />
          <path d="M13 6 11 18" />
        </svg>
      );
    case "agent":
      return (
        <svg {...shared}>
          <path d="M12 3v2" />
          <rect x="5" y="7" width="14" height="12" rx="2" />
          <circle cx="9.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
          <path d="M9.5 16.5h5" />
          <path d="M8 7V5a4 4 0 0 1 8 0v2" />
        </svg>
      );
    case "evals":
      return (
        <svg {...shared}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15V11" />
          <path d="M12 15V8" />
          <path d="M16 15v-5" />
        </svg>
      );
    case "telemetry":
      return (
        <svg {...shared}>
          <path d="M22 12h-4l-3 9L9 3 7 12H2" />
        </svg>
      );
  }
}
