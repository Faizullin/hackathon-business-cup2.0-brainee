"use client";

import Link from "next/link";
import { Brainy } from "@/components/Brainy";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { RecommendationCards, useRecommendations } from "@/components/child/Recommendations";
import { FloatingLocalePill } from "@/components/LocaleSwitcher";
import { useI18n } from "@/i18n";

// T-31: shown on every entry into child mode. No close button or swipe; the choice is logged.
function Entry() {
  const { snapshot, act } = useLearning();
  const recs = useRecommendations();
  const { t } = useI18n();
  if (!snapshot) return null;
  const te = t.child.entry;
  const first = recs[0];
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-4 sm:p-8 lg:max-w-5xl">
      <FloatingLocalePill />
      <h1 className="text-center">{te.title}</h1>
      <div className="flex items-center gap-4 rounded-panel border border-border bg-card p-4">
        <Brainy
          stats={snapshot.progress.stats}
          equipped={snapshot.showcase.equipped}
          label=""
          className="h-28 w-auto shrink-0"
        />
        {first && (
          <p className="relative rounded-2xl bg-sky/10 p-4 font-heading font-semibold text-lg">
            {te.ask(t.skills[first.skill].toLowerCase())}
          </p>
        )}
      </div>
      <RecommendationCards big onChoose={() => void act({ type: "entry-choice", took: true })} />
      <Link
        href="/learn"
        onClick={() => void act({ type: "entry-choice", took: false })}
        className="mt-auto self-center p-3 text-muted-foreground text-sm underline-offset-4 hover:underline"
      >
        {te.other}
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
