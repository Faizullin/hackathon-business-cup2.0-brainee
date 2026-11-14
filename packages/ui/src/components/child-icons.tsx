import type { ComponentProps } from "react";

// Child-facing line icons ported from the prototype ICONS (48×48 grid) + ★/☀ currency marks.
const PATHS = {
  learn: (
    <>
      <circle cx="11" cy="24" r="6" />
      <rect x="20" y="18" width="12" height="12" rx="2" />
      <path d="M40 17l6 13h-12z" />
    </>
  ),
  leisure: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M20 16l12 8-12 8z" />
    </>
  ),
  gifts: (
    <>
      <rect x="7" y="18" width="34" height="23" rx="3" />
      <path d="M5 12h38v6H5zM24 12v29" />
      <path d="M24 12c-4-8-14-6-10 0M24 12c4-8 14-6 10 0" />
    </>
  ),
  brainy: (
    <>
      <path d="M24 41V22" />
      <path d="M24 27c-10 0-14-6-14-13 8 0 14 4 14 13z" />
      <path d="M24 22c0-8 6-12 14-12 0 6-4 12-14 12z" />
    </>
  ),
} as const;

export type ChildIconName = keyof typeof PATHS;

export function ChildIcon({ name, ...props }: { name: ChildIconName } & ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

export function StarIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z"
        fill="var(--sun)"
      />
    </svg>
  );
}

export function SunIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="5" fill="var(--orange)" />
      <path
        d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"
        stroke="var(--orange)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
