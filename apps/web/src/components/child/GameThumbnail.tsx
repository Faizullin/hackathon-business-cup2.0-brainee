import { GameCardMedia } from "@brainee/ui/components/game-card-media";
import { SkillIcon } from "./SkillIcon";

/** App skill badge on the shared, failure-safe card media. */
export function GameThumbnail({
  src,
  skill,
  locked,
  ageLabel,
  className,
}: {
  src: string;
  skill?: string;
  locked?: boolean;
  ageLabel?: string;
  className?: string;
}) {
  return (
    <GameCardMedia
      src={src}
      locked={locked}
      ageLabel={ageLabel}
      className={className}
      badge={skill ? <SkillIcon skill={skill} /> : undefined}
    />
  );
}
