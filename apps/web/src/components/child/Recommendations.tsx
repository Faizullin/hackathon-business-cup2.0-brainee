"use client";

import { type Ability, type AbilityScores, recommendGames } from "@brainee/core";
import { useCatalog } from "@brainee/games";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { useMemo } from "react";
import { Chip } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { GameThumbnail } from "./GameThumbnail";
import { useLearning } from "./LearningProvider";

/** T-25 on seeded skill scores and illustrative age averages (T-83 keeps real norms open). */
export function useRecommendations() {
  const { games: allGames } = useCatalog();
  const { snapshot } = useLearning();
  return useMemo(() => {
    if (!snapshot) return [];
    const { ageAverages } = snapshot.showcase;
    // Live ability scores (D-23) and only games open for the child's age (D-22).
    const scores: AbilityScores = snapshot.progress.skills;
    const age = new Date().getFullYear() - snapshot.child.birthYear;
    const open = allGames.filter((game) => game.minAge <= age);
    const recs = recommendGames(
      scores,
      ageAverages,
      open,
      snapshot.learningHistory ?? [],
      Date.now(),
    );
    // Fill gaps with remaining age-eligible games when a top skill has no candidate.
    const extra = open
      .filter((game) => game.kind === "dev" && !recs.some((rec) => rec.game.id === game.id))
      .map((game) => {
        const skill = game.skills.main as Ability;
        return {
          skill,
          score: scores[skill],
          ageAverage: ageAverages[skill],
          gap: scores[skill] - ageAverages[skill],
          game,
          playedLast7Days: 0,
        };
      })
      .sort((a, b) => a.gap - b.gap);
    return [...recs, ...extra].slice(0, 3);
  }, [snapshot, allGames]);
}

export function RecommendationCards({
  big = false,
  onChoose,
}: {
  big?: boolean;
  onChoose?: (gameId: string) => void;
}) {
  const recs = useRecommendations();
  const { t } = useI18n();
  const te = t.child.entry;
  return (
    <ul className={cn("grid gap-3", big ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3")}>
      {recs.map((rec, index) => {
        const skill = t.skills[rec.skill];
        return (
          <li key={rec.game.id}>
            <Link
              prefetch={false}
              href={`/game/${rec.game.id}?recommended=1`}
              onClick={() => onChoose?.(rec.game.id)}
              data-testid="recommended-game"
              className={cn(
                "flex h-full gap-3 rounded-panel ring-1 bg-card p-4 transition-transform duration-(--dur-press) active:scale-[0.97]",
                // Compact Learn cards are a row on phones so two recommendations fit above the grid.
                big ? "min-h-40 flex-col p-5" : "items-center sm:flex-col sm:items-stretch",
                index === 0 ? "ring-highlight ring-2" : "ring-border",
              )}
            >
              <GameThumbnail
                src={rec.game.thumbnail}
                skill={rec.skill}
                className={cn(!big && "w-28 shrink-0 sm:w-full", big && "order-1")}
              />
              <span className={cn("flex min-w-0 flex-col gap-1", big && "contents")}>
                {index === 0 && (
                  <span className={cn(big && "order-0")}>
                    <Chip tone="highlight">{te.top}</Chip>
                  </span>
                )}
                <span className={cn("font-semibold", big && "order-2 text-lg")}>
                  {rec.game.title}
                </span>
                <span className={cn("text-muted-foreground text-sm", big && "order-3")}>
                  {te.reason(skill, rec.score, rec.ageAverage)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
