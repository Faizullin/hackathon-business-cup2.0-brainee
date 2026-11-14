"use client";

import { Card, CardDescription, CardHeader } from "@brainee/ui/components/card";
import Link from "next/link";
import { GameGrid } from "@/components/child/GameGrid";
import { RecommendationCards } from "@/components/child/Recommendations";
import { useI18n } from "@/i18n";

export function LearnContent() {
  const { t } = useI18n();
  return (
    <>
      <Card>
        <CardHeader>
          <h1>{t.learn.title}</h1>
          <CardDescription className="mt-1 max-w-prose text-base">
            {t.learn.description}
          </CardDescription>
        </CardHeader>
      </Card>
      <section aria-labelledby="advice" className="flex flex-col gap-3">
        <h2 id="advice" className="font-heading font-semibold text-lg">
          {t.child.advice}
        </h2>
        <RecommendationCards />
      </section>
      <section aria-labelledby="all-games" className="flex flex-col gap-3">
        <h2 id="all-games" className="font-heading font-semibold text-lg">
          {t.learn.allGames}
        </h2>
        <GameGrid />
      </section>
      <Link
        href="/explore"
        className="rounded-xl border border-border p-4 text-sm text-muted-foreground"
      >
        Explore · free play, no stars →
      </Link>
    </>
  );
}
