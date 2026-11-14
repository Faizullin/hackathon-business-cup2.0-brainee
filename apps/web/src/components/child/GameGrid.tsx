"use client";

import { allGames } from "@brainee/games";
import { ChildIcon } from "@brainee/ui/components/child-icons";
import { Lock } from "@brainee/ui/components/icons";
import Link from "next/link";
import { ru } from "@/i18n/ru";
import { useLearning } from "./LearningProvider";

/** D-22: every game shows its minimum age; games above the child's age stay locked. */
export function GameGrid() {
  const { snapshot } = useLearning();
  const age = snapshot ? new Date().getFullYear() - snapshot.child.birthYear : 10;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {allGames.map((game) => {
        const skill = ru.skills[game.skills.main as keyof typeof ru.skills] ?? game.skills.main;
        const locked = age < game.minAge;
        const body = (
          <>
            <span className="flex items-start justify-between gap-2">
              <ChildIcon name="learn" className="size-10 text-sky" />
              <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-xs">
                {locked ? ru.learn.lockedAge(game.minAge) : ru.learn.fromAge(game.minAge)}
              </span>
            </span>
            <span>
              <span className="block font-semibold">{game.title}</span>
              <span className="text-muted-foreground text-sm">{skill}</span>
            </span>
          </>
        );
        const card =
          "flex min-h-32 flex-col justify-between gap-3 rounded-panel border border-border bg-card p-4";
        return (
          <li key={game.id}>
            {locked ? (
              <div aria-disabled="true" className={`${card} opacity-60`}>
                <Lock aria-hidden="true" className="size-4" />
                {body}
              </div>
            ) : (
              <Link
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
