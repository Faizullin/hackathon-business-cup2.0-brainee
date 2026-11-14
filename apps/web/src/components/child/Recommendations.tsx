"use client";

import { type Ability, type AbilityScores, recommendGames } from "@brainee/core";
import { allGames } from "@brainee/games";
import { ChildIcon } from "@brainee/ui/components/child-icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { useMemo } from "react";
import { Chip } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { useLearning } from "./LearningProvider";

/** T-25 on seeded skill scores and illustrative age averages (T-83 keeps real norms open). */
export function useRecommendations() {
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
  }, [snapshot]);
}

export function RecommendationCards({
  big = false,
  onChoose,
}: {
  big?: boolean;
  onChoose?: (gameId: string) => void;
}) {
  const recs = useRecommendations();
  const { t, tc } = useI18n();
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
                "flex h-full flex-col gap-2 rounded-panel border bg-card p-4 transition-transform duration-(--dur-press) active:scale-[0.97]",
                index === 0 ? "border-coral border-2" : "border-border",
                big && "min-h-40 p-5",
              )}
            >
              {index === 0 && (
                <span>
                  <Chip tone="coral">{te.top}</Chip>
                </span>
              )}
              <ChildIcon name="learn" className={cn("text-sky", big ? "size-12" : "size-9")} />
              <span className={cn("font-semibold", big && "text-lg")}>{tc(rec.game.title)}</span>
              <span className="text-muted-foreground text-sm">
                {te.reason(skill, rec.score, rec.ageAverage)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
