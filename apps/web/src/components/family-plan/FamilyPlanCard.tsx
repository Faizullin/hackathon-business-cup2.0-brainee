"use client";
import {
  type FunnelAnswers,
  type FunnelQuestionId,
  isFunnelAnswers,
  planFor,
  planText,
  question,
} from "@brainee/core";
import { AnswerGroup } from "@brainee/ui/components/answer-group";
import { useState } from "react";
import { useLearning } from "@/components/child/LearningProvider";
import { Notice, outlineButton, Panel, primaryButton, useAct } from "@/components/demo/kit";
import { AnswerSummary } from "@/components/funnel/AnswerSummary";
import { familyPlanCopy as c } from "./copy";

export function FamilyPlanCard() {
  const { snapshot } = useLearning();
  const answers = snapshot?.showcase.familyPlan;
  const [draft, setDraft] = useState<FunnelAnswers | null>(null);
  const [selected, setSelected] = useState<FunnelQuestionId | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const { run, busy, notice } = useAct();
  if (!isFunnelAnswers(answers)) return null;
  const plan = planFor(answers);
  if (!plan) return null;
  const q = selected ? question(selected) : null;
  return (
    <div data-testid="family-plan">
      <Panel title={c.title} className="lg:col-span-2">
        <blockquote className="rounded-panel bg-[#1c1b33] p-5 text-white">
          <p className="mb-2 text-sm text-[#cfcde6]">{c.phrase}</p>
          <p className="font-heading text-xl">{plan.cue}</p>
        </blockquote>
        <ol className="grid gap-3 sm:grid-cols-2">
          {plan.steps.map((step, i) => (
            <li key={step.label} className="rounded-panel bg-violet-wash p-4">
              <p className="font-semibold text-accent">
                {i + 1}. {step.label}
              </p>
              <h3 className="my-1 font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        <p>
          <strong>{c.notice}: </strong>
          {plan.check}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryButton}
            onClick={() => {
              setDraft({ ...answers });
              setSelected(null);
            }}
          >
            {c.edit}
          </button>
          <a
            className={outlineButton}
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(planText(answers))}`}
            download="brainy-family-plan.txt"
          >
            {c.download}
          </a>
          <button
            type="button"
            className={outlineButton}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(planText(answers));
                setCopyStatus(c.copied);
              } catch {
                setCopyStatus(c.copyFailed);
              }
            }}
          >
            {c.copy}
          </button>
        </div>
        {copyStatus && <p role="status">{copyStatus}</p>}
        {draft && (
          <div className="space-y-4 rounded-panel bg-surface-2 p-4">
            <AnswerSummary answers={draft} onChange={setSelected} />
            {q && (
              <AnswerGroup
                label={q.title}
                options={q.options.filter((o) => o.value !== "outside")}
                value={draft[q.id]}
                onChange={(value) => setDraft({ ...draft, [q.id]: value })}
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || !isFunnelAnswers(draft)}
                className={primaryButton}
                onClick={async () => {
                  if (await run({ type: "family-plan", answers: draft }, c.saved)) setDraft(null);
                }}
              >
                {c.save}
              </button>
              <button type="button" className={outlineButton} onClick={() => setDraft(null)}>
                {c.cancel}
              </button>
            </div>
          </div>
        )}
        <Notice notice={notice} />
      </Panel>
    </div>
  );
}
