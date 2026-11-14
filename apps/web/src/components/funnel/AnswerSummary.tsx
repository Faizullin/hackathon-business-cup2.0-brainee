"use client";
import {
  ATTEMPT,
  choiceLabel,
  FUNNEL_QUESTIONS,
  type FunnelDraft,
  type FunnelQuestionId,
  MOMENT,
} from "@brainee/core";
import { funnelCopy as c } from "./copy";
export function AnswerSummary({
  answers,
  onChange,
}: {
  answers: FunnelDraft;
  onChange: (id: FunnelQuestionId) => void;
}) {
  return (
    <details className="rounded-panel bg-card p-4 ring-1 ring-border">
      <summary className="cursor-pointer font-bold">{c.review}</summary>
      <dl className="mt-4 space-y-4">
        {[...FUNNEL_QUESTIONS, ATTEMPT, MOMENT].map((q) => (
          <div key={q.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <dt className="text-sm text-muted-foreground">{q.title}</dt>
              <dd className="font-semibold">{choiceLabel(q.id, answers[q.id])}</dd>
            </div>
            <button
              type="button"
              className="min-h-11 text-accent"
              onClick={() => onChange(q.id)}
              aria-label={`${c.change}: ${q.title}`}
            >
              {c.change}
            </button>
          </div>
        ))}
      </dl>
    </details>
  );
}
