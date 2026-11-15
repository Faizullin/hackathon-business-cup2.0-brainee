"use client";

import { type ReactNode, useState } from "react";
import { cn } from "../lib/utils";
import { Brain, Lock } from "./icons";

/** Same-origin SVG or raster art. The frame never changes size on load or failure. */
export function GameCardMedia({
  src,
  locked = false,
  ageLabel,
  badge,
  className,
}: {
  src: string;
  locked?: boolean;
  ageLabel?: string;
  badge?: ReactNode;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  // Root-relative paths include both local /games and proxied /g versioned assets.
  const safe =
    /^\/(?!\/)/.test(src) &&
    !src.includes("\\") &&
    !Array.from(src).some((char) => char.charCodeAt(0) <= 32);
  const failed = !safe || failedSrc === src;
  return (
    <span
      className={cn(
        "relative isolate block aspect-[4/3] w-full overflow-hidden rounded-(--ui-media-radius) bg-violet-wash ring-1 ring-inset ring-border",
        className,
      )}
    >
      {failed ? (
        <span
          data-testid="game-thumbnail-fallback"
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-wash to-highlight-wash text-mint",
            locked && "opacity-50",
          )}
        >
          <Brain className="size-12" />
          <span className="font-heading text-sm">Brainy</span>
        </span>
      ) : (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          data-testid="game-thumbnail"
          loading="lazy"
          decoding="async"
          width={400}
          height={300}
          onError={() => setFailedSrc(src)}
          className={cn("absolute inset-0 block size-full object-cover", locked && "opacity-50")}
        />
      )}
      {badge && (
        <span className="absolute bottom-2 left-2 origin-bottom-left scale-75 md:scale-100">
          {badge}
        </span>
      )}
      {locked && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="flex size-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
            <Lock className="size-5" />
          </span>
        </span>
      )}
      {ageLabel && (
        <span className="absolute top-2 right-2 max-w-[calc(100%-16px)] rounded-full bg-card/95 px-2 py-1 text-xs font-semibold">
          {ageLabel}
        </span>
      )}
    </span>
  );
}
