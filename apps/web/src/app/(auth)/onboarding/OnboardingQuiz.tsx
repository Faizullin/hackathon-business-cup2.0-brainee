"use client";

import { Brainy } from "@brainee/brainy";
import { QUIZ_QUESTIONS, type QuizAnswers, quizStart, stageOf } from "@brainee/core";
import { cn } from "@brainee/ui/lib/utils";
import { type FormEvent, useState } from "react";
import { outlineButton, primaryButton } from "@/components/demo/kit";
import { HoldToStart } from "@/components/HoldToStart";
import { ru } from "@/i18n/ru";

const t = ru.onboarding;
const input = "min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base";

// D-24: the habit quiz comes BEFORE the account; its answers set the starting Brainy.
export function OnboardingQuiz() {
  const [phase, setPhase] = useState<"quiz" | "story" | "reveal" | "signup">("quiz");
  const [reaction, setReaction] = useState(1);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const done = step >= QUIZ_QUESTIONS.length;
  const start = done ? quizStart(answers as QuizAnswers) : null;

  const answer = (value: number) => {
    setAnswers((a) => ({ ...a, [QUIZ_QUESTIONS[step] as string]: value }));
    setReaction(value);
    setStep((s) => s + 1);
    if (step === QUIZ_QUESTIONS.length - 1) setPhase("story");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          pin: form.get("pin"),
          childName: form.get("childName"),
          birthYear: Number(form.get("birthYear")),
          answers,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      setBusy(false);
      if (response.ok) {
        // Fresh page load: the new device cookie belongs to the new child.
        window.location.assign("/entry");
        return;
      }
      const reply = (await response.json().catch(() => ({}))) as { error?: string };
      setError(reply.error === "email-taken" ? t.taken : t.invalid);
    } catch {
      setError(t.invalid);
    } finally {
      setBusy(false);
    }
  };

  const progress = (
    <div
      role="progressbar"
      aria-label={t.title}
      aria-valuemin={0}
      aria-valuemax={7}
      aria-valuenow={phase === "signup" ? 7 : step}
      className="h-2 overflow-hidden rounded-full bg-line"
    >
      <div
        className="h-full bg-coral transition-[width] motion-reduce:transition-none"
        style={{ width: `${((phase === "signup" ? 7 : step) / 7) * 100}%` }}
      />
    </div>
  );
  const preview = quizStart({ hours: 1, content: 1, finish: 1, reaction: 1, reads: 1, ...answers });
  if (phase === "story")
    return (
      <section className="mx-auto flex max-w-xl flex-col gap-5">
        {progress}
        <div className="flex flex-col items-center gap-5 rounded-panel border border-border bg-card p-6 text-center">
          <Brainy stats={preview.stats} className="h-48 w-48" />
          <h1>{t.monster}</h1>
          <p>{t.monsterStory}</p>
          <button
            type="button"
            className={`${primaryButton} min-h-14 w-full`}
            onClick={() => setPhase("reveal")}
          >
            {t.continue}
          </button>
          <button
            type="button"
            className={outlineButton}
            onClick={() => {
              setPhase("quiz");
              setStep(4);
            }}
          >
            {t.back}
          </button>
        </div>
      </section>
    );
  if (phase === "reveal")
    return (
      <section className="mx-auto flex max-w-xl flex-col gap-5">
        {progress}
        <div className="flex flex-col items-center gap-4 rounded-panel border border-border bg-card p-6 text-center">
          <h1>{t.resultTitle}</h1>
          <Brainy stats={preview.stats} className="h-56 w-auto" />
          <p>{t.story}</p>
          <p className="text-sm text-muted-foreground">{t.baseline}</p>
          <HoldToStart onStart={() => setPhase("signup")} />
          <button type="button" className={outlineButton} onClick={() => setPhase("story")}>
            {t.back}
          </button>
        </div>
      </section>
    );
  if (!done) {
    const question = t.questions[step];
    if (!question) return null;
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        {progress}
        <h1>{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
        <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm" data-testid="quiz-progress">
            {t.progress(step + 1, QUIZ_QUESTIONS.length)}
          </p>
          <div className="grid items-center gap-5 lg:grid-cols-2">
            <div className="flex flex-col items-center">
              <Brainy stats={preview.stats} className="h-36 w-auto lg:h-64" />
              <p aria-live="polite" className="text-muted-foreground text-sm">
                {t.reaction[reaction]}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="font-heading font-semibold text-xl">{question.q}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.o.map((option, value) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => answer(value)}
                    className={cn(outlineButton, "min-h-14 justify-start text-left text-base")}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className={cn(outlineButton, "self-start")}
            >
              {t.back}
            </button>
          )}
        </div>
      </section>
    );
  }

  const stage = start ? stageOf(start.stats) : null;
  return (
    <section className="mx-auto grid w-full max-w-4xl gap-5 lg:grid-cols-2">
      <div className="col-span-full">{progress}</div>
      <div className="flex flex-col items-center gap-3 rounded-panel border border-border bg-card p-5 text-center">
        <h1>{t.resultTitle}</h1>
        {start && <Brainy stats={start.stats} className="h-56 w-auto" />}
        {stage && <p className="font-heading font-semibold text-lg">{ru.stages[stage.id]}</p>}
        <p>{t.story}</p>
        <p className="text-muted-foreground text-sm">{t.baseline}</p>
      </div>
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-panel border border-border bg-card p-5"
      >
        <h2 className="font-heading font-semibold text-xl">{t.signup}</h2>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {t.childName}
          <input name="childName" required maxLength={40} className={input} />
        </label>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {t.birthYear}
          <input
            name="birthYear"
            type="number"
            required
            min={new Date().getFullYear() - 10}
            max={new Date().getFullYear() - 4}
            defaultValue={new Date().getFullYear() - 6}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {ru.login.email}
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {t.passwordHint}
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {t.pin}
          <input
            name="pin"
            inputMode="numeric"
            required
            pattern="\d{4}"
            maxLength={4}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {t.referral}
          <input name="referral" maxLength={40} className={input} />
          <span className="text-muted-foreground text-xs">{t.referralNote}</span>
        </label>
        <button type="button" className={outlineButton} onClick={() => setPhase("reveal")}>
          {t.back}
        </button>
        {error && (
          <p role="alert" className="rounded-xl bg-coral/15 p-3 text-sm">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={cn(primaryButton, "min-h-12")}>
          {t.create}
        </button>
      </form>
    </section>
  );
}
