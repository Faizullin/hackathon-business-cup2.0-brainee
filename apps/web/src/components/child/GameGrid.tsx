"use client";

import { allGames } from "@brainee/games";
import Link from "next/link";
import { useI18n } from "@/i18n";
import { GameThumbnail } from "./GameThumbnail";
import { useLearning } from "./LearningProvider";

/** D-22: every game shows its minimum age; games above the child's age stay locked. */
export function GameGrid() {
  const { snapshot } = useLearning();
  const { t } = useI18n();
  const age = snapshot ? new Date().getFullYear() - snapshot.child.birthYear : 10;
  return (
    <ul className="ui-grid grid grid-cols-2">
      {allGames.map((game, index) => {
        const skill = t.skills[game.skills.main as keyof typeof t.skills] ?? game.skills.main;
        const locked = age < game.minAge;
        const body = (
          <>
            <span>
              <GameThumbnail
                src={game.thumbnail}
                skill={game.skills.main}
                locked={locked}
                ageLabel={locked ? t.learn.lockedAge(game.minAge) : t.learn.fromAge(game.minAge)}
              />
            </span>
            <span>
              <span className="block font-semibold">{game.title}</span>
              <span className="text-muted-foreground text-sm">{skill}</span>
            </span>
          </>
        );
        const card = "ui-game-card";
        return (
          <li
            key={game.id}
            className={
              index === allGames.length - 1 && allGames.length % 2 === 1
                ? "col-span-2 w-[calc((100%-var(--ui-card-gap))/2)] justify-self-center"
                : undefined
            }
          >
            {locked ? (
              <div aria-disabled="true" className={`${card} text-muted-foreground`}>
                {body}
              </div>
            ) : (
              <Link
                prefetch={false}
                href={`/game/${game.id}`}
                className={`${card} transition-transform duration-(--dur-press) active:scale-[0.97]`}
              >
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
