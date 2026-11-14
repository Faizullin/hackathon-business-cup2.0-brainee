"use client";

import { Flame } from "@brainee/ui/components/icons";
import Link from "next/link";
import { GameGrid } from "@/components/child/GameGrid";
import { RecommendationCards } from "@/components/child/Recommendations";
import { useI18n } from "@/i18n";
import { useLearning } from "./LearningProvider";
import { childDesignCopy as copy } from "./redesign-copy";

export function LearnContent() {
  const { t, locale } = useI18n();
  const { snapshot } = useLearning();
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 py-1">
        <h1 className="sr-only">{t.learn.title}</h1>
        <div>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              month: "short",
              day: "numeric",
              timeZone: snapshot?.showcase.calendar?.timeZone,
            }).format(new Date())}
          </p>
          <h2 className="font-heading text-2xl">{copy.greeting(snapshot?.child.name)}</h2>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-highlight-wash px-3 py-2 text-xs font-bold">
          <Flame aria-hidden="true" className="size-5 text-sun" />
          {copy.streak(snapshot?.activity?.streakDays ?? 0)}
        </span>
      </header>
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
        {locale === "ru" ? "Свободная игра · без звёзд →" : "Explore · free play, no stars →"}
      </Link>
    </>
  );
}
