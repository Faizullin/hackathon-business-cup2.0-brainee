"use client";

import { Brainy } from "@brainee/brainy";
import Link from "next/link";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { RecommendationCards, useRecommendations } from "@/components/child/Recommendations";
import { ru } from "@/i18n/ru";

// T-31: shown on every entry into child mode. No close button or swipe; the choice is logged.
function Entry() {
  const { snapshot, act } = useLearning();
  const recs = useRecommendations();
  if (!snapshot) return null;
  const t = ru.child.entry;
  const first = recs[0];
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-4 sm:p-8">
      <h1 className="text-center">{t.title}</h1>
      <div className="flex items-center gap-4 rounded-panel border border-border bg-card p-4">
        <Brainy
          stats={snapshot.progress.stats}
          equipped={snapshot.showcase.equipped}
          label=""
          className="h-28 w-auto shrink-0"
        />
        {first && (
          <p className="relative rounded-2xl bg-sky/10 p-4 font-heading font-semibold text-lg">
            {t.ask(ru.skills[first.skill].toLowerCase())}
          </p>
        )}
      </div>
      <RecommendationCards big onChoose={() => void act({ type: "entry-choice", took: true })} />
      <Link
        href="/learn"
        onClick={() => void act({ type: "entry-choice", took: false })}
        className="mt-auto self-center p-3 text-muted-foreground text-sm underline-offset-4 hover:underline"
      >
        {t.other}
      </Link>
    </section>
  );
}

export function EntryScreen() {
  return (
    <LearningBoundary game>
      <Entry />
    </LearningBoundary>
  );
}
