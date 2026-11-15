import type { ReactNode } from "react";

export const playerSurface =
  "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 bg-(--game-surface) p-3 lg:max-w-5xl lg:p-5";
export const iconControl =
  "inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-xl p-3 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function PlayerHeader({
  exit,
  title,
  subtitle,
  status,
}: {
  exit: ReactNode;
  title: string;
  subtitle?: ReactNode;
  status: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 rounded-stage bg-(--game-tile) px-3 py-2 ring-1 ring-(--game-tile-ring)">
      {exit}
      <div className="min-w-0 flex-1">
        <h1 className="!text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      <div className="shrink-0">{status}</div>
    </header>
  );
}
