/** Line icons in the style of the pitch deck. Drawn here so nothing loads from another origin. */
const PATHS = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  scale:
    "m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1ZM7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2",
  lock: "M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2ZM8 11V7a4 4 0 0 1 8 0v4",
  star: "m12 2.8 2.7 5.5 6 .9-4.4 4.3 1.1 6.1L12 16.7l-5.4 2.9 1-6.1-4.3-4.3 6-.9Z",
  sun: "M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
  chart: "M3 3v16a2 2 0 0 0 2 2h16M18 17V9M13 17V5M8 17v-3",
  ice: "m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11M17 7A5 5 0 0 0 7 7M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4",
  ticket:
    "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2ZM13 5v2m0 4v2m0 4v2",
  wheel:
    "M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM12 2v4m-5.2 9-3.5 2m17.4-10-3.5 2M6.8 9 3.3 7m17.4 10-3.5-2M9 22l3-8 3 8m-7 0h8m2-3.3a9 9 0 1 0-12 0",
  gift: "M4 8h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM12 8v13m7-9v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5",
  puzzle:
    "M15.4 8.6 14 7.2a2 2 0 1 0-3.2-.8L8 9.2 9.4 10.6a2 2 0 1 1-2.8 2.8L5.2 12 3 14.2l6.8 6.8 2.2-2.2-1.4-1.4a2 2 0 1 1 2.8-2.8l1.4 1.4 2.8-2.8-1.4-1.4a2 2 0 1 1 2.8-2.8l1.4 1.4L23 10.2 16.2 3.4 14 5.6",
  cape: "M8 3h8l1 4-5 3-5-3 1-4ZM7 7 4 21l8-3 8 3-3-14",
} as const;
export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "i" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
