import { Lock } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import { SkillIcon } from "./SkillIcon";

/**
 * Card image slot for every game card (Learn, Recommendations, Entry, Explore).
 * The 4:3 SVG shows the game's mechanic; the skill stays as a small badge.
 * Locked games show the image at half opacity with a lock.
 */
export function GameThumbnail({
  src,
  skill,
  locked = false,
  className,
}: {
  src: string;
  skill?: string;
  locked?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative block aspect-[4/3] w-full", className)}>
      {/* biome-ignore lint/performance/noImgElement: static same-origin SVG, no optimization needed */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        data-testid="game-thumbnail"
        loading="lazy"
        decoding="async"
        width={160}
        height={120}
        className={cn("block size-full rounded-[18px]", locked && "opacity-50")}
      />
      {skill && (
        <span className="absolute bottom-1.5 left-1.5 scale-75 origin-bottom-left">
          <SkillIcon skill={skill} />
        </span>
      )}
      {locked && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
            <Lock aria-hidden="true" className="size-4" />
          </span>
        </span>
      )}
    </span>
  );
}
