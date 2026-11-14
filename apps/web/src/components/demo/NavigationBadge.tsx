export function NavigationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      aria-hidden="true"
      data-testid="navigation-badge"
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-coral px-1.5 py-0.5 text-xs font-semibold text-white"
    >
      {count}
    </span>
  );
}
