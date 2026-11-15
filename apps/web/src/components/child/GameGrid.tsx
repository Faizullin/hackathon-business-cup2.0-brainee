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
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {allGames.map((game, index) => {
        const skill = t.skills[game.skills.main as keyof typeof t.skills] ?? game.skills.main;
        const locked = age < game.minAge;
        const body = (
          <>
            <span className="relative">
              <GameThumbnail src={game.thumbnail} skill={game.skills.main} locked={locked} />
              <span className="absolute top-1.5 right-1.5 rounded-full bg-card/90 px-2 py-0.5 font-medium text-xs">
                {locked ? t.learn.lockedAge(game.minAge) : t.learn.fromAge(game.minAge)}
              </span>
            </span>
            <span>
              <span className="block font-semibold">{game.title}</span>
              <span className="text-muted-foreground text-sm">{skill}</span>
            </span>
          </>
        );
        const card =
          "flex min-h-32 flex-col justify-between gap-3 rounded-panel ring-1 ring-border bg-card p-3";
        return (
          <li
            key={game.id}
            className={
              index === allGames.length - 1
                ? `${allGames.length % 2 === 1 ? "col-span-2 w-[calc(50%-6px)] justify-self-center" : ""} sm:col-span-1 sm:w-auto sm:justify-self-stretch ${allGames.length % 3 === 1 ? "sm:col-start-2" : ""}`
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
