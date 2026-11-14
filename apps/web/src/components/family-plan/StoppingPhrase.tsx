"use client";
import { planFor } from "@brainee/core";
import { useLearning } from "@/components/child/LearningProvider";
import { familyPlanCopy as c } from "./copy";
export function StoppingPhrase() {
  const { snapshot } = useLearning();
  const plan = snapshot?.showcase.familyPlan ? planFor(snapshot.showcase.familyPlan) : null;
  if (!plan) return null;
  return (
    <blockquote
      data-testid="stopping-phrase"
      className="rounded-panel bg-highlight-wash p-4 text-ink"
    >
      <p className="mb-1 text-sm font-semibold text-muted-foreground">{c.phrase}</p>
      <p className="font-heading text-lg">{plan.cue}</p>
    </blockquote>
  );
}
