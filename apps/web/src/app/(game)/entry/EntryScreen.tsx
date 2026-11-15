"use client";

import Link from "next/link";
import { Brainy } from "@/components/Brainy";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { RecommendationCards, useRecommendations } from "@/components/child/Recommendations";
import { StarterUnlock } from "@/components/child/StarterUnlock";
import { FamilyLoginCard } from "@/components/parent/FamilyLoginCard";
import { useI18n } from "@/i18n";

// T-31: shown on every entry into child mode. No close button or swipe; the choice is logged.
function Entry() {
  const { snapshot, act } = useLearning();
  const recs = useRecommendations();
  const { t } = useI18n();
  if (!snapshot) return null;
  const pack = snapshot.showcase.starterPack === "pending";
  const te = t.child.entry;
  const first = recs[0];
  return (
    <section
      data-mode="child"
      className="ui-surface ui-stack mx-auto flex w-full max-w-5xl flex-1 flex-col p-(--ui-page-padding)"
    >
      {pack && (
        <StarterUnlock snapshot={snapshot} onSeen={() => void act({ type: "starter-seen" })} />
      )}
      {!pack && <FamilyLoginCard childId={snapshot.child.id} />}
      <h1 className="text-center">{te.title}</h1>
      <div className="flex items-center gap-4 rounded-stage bg-[#1c1b33] p-5 text-white shadow-xl shadow-[#1c1b33]/15">
        <Brainy
          stats={snapshot.progress.stats}
          mood={snapshot.progress.mood}
          earned={snapshot.showcase.earned}
          animate
          equipped={snapshot.showcase.equipped}
          label=""
          className="h-32 w-auto shrink-0 rounded-full bg-[#f2f1fa]"
        />
        {first && (
          <p className="relative rounded-2xl bg-night p-4 font-heading font-semibold text-lg">
            {te.ask(t.skills[first.skill].toLowerCase())}
          </p>
        )}
      </div>
      <RecommendationCards big onChoose={() => void act({ type: "entry-choice", took: true })} />
      <Link
        href="/learn"
        onClick={() => void act({ type: "entry-choice", took: false })}
        className="ui-control mt-auto inline-flex items-center self-center p-3 text-muted-foreground text-sm underline-offset-4 hover:underline"
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
