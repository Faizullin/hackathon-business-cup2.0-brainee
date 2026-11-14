import { BookOpen, Brain, Gift, Play } from "lucide-react";
import type { ComponentProps } from "react";

const ICONS = { learn: BookOpen, leisure: Play, gifts: Gift, brainy: Brain };
export type ChildIconName = keyof typeof ICONS;
export function ChildIcon({ name, ...props }: { name: ChildIconName } & ComponentProps<"svg">) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} strokeWidth={2} />;
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
