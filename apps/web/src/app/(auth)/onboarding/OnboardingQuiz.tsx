"use client";

import { QUIZ_QUESTIONS, type QuizAnswers, quizStart, stageOf } from "@brainee/core";
import { cn } from "@brainee/ui/lib/utils";
import { type FormEvent, useState } from "react";
import { Brainy } from "@/components/Brainy";
import { outlineButton, primaryButton } from "@/components/demo/kit";
import { HoldToStart } from "@/components/HoldToStart";
import { useI18n } from "@/i18n";

const input = "min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base";

// D-24: the habit quiz comes BEFORE the account; its answers set the starting Brainy.
export function OnboardingQuiz() {
  const { t } = useI18n();
  const to = t.onboarding;
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
        window.location.assign("/onboarding/setup");
        return;
      }
      const reply = (await response.json().catch(() => ({}))) as { error?: string };
      setError(reply.error === "email-taken" ? to.taken : to.invalid);
    } catch {
      setError(to.invalid);
    } finally {
      setBusy(false);
    }
  };

  const progress = (
    <div
      role="progressbar"
      aria-label={to.title}
      aria-valuemin={0}
      aria-valuemax={7}
      aria-valuenow={phase === "signup" ? 7 : step}
      className="h-2 overflow-hidden rounded-full bg-line"
    >
      <div
        className="h-full bg-accent transition-[width] motion-reduce:transition-none"
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
          <h1>{to.monster}</h1>
          <p>{to.monsterStory}</p>
          <button
            type="button"
            className={`${primaryButton} min-h-14 w-full`}
            onClick={() => setPhase("reveal")}
          >
            {to.continue}
          </button>
          <button
            type="button"
            className={outlineButton}
            onClick={() => {
              setPhase("quiz");
              setStep(4);
            }}
          >
            {to.back}
          </button>
        </div>
      </section>
    );
  if (phase === "reveal")
    return (
      <section className="mx-auto flex max-w-xl flex-col gap-5">
        {progress}
        <div className="flex flex-col items-center gap-4 rounded-panel border border-border bg-card p-6 text-center">
          <h1>{to.resultTitle}</h1>
          <Brainy stats={preview.stats} className="h-56 w-auto" />
          <p>{to.story}</p>
          <p className="text-sm text-muted-foreground">{to.baseline}</p>
          <HoldToStart onStart={() => setPhase("signup")} />
          <button type="button" className={outlineButton} onClick={() => setPhase("story")}>
            {to.back}
          </button>
        </div>
      </section>
    );
  if (!done) {
    const question = to.questions[step];
    if (!question) return null;
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        {progress}
        <h1>{to.title}</h1>
        <p className="text-muted-foreground">{to.intro}</p>
        <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-5">
          <p className="text-muted-foreground text-sm" data-testid="quiz-progress">
            {to.progress(step + 1, QUIZ_QUESTIONS.length)}
          </p>
          <div className="grid items-center gap-5 lg:grid-cols-2">
            <div className="flex flex-col items-center">
              <Brainy stats={preview.stats} className="h-36 w-auto lg:h-64" />
              <p aria-live="polite" className="text-muted-foreground text-sm">
                {to.reaction[reaction]}
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
              {to.back}
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
        <h1>{to.resultTitle}</h1>
        {start && <Brainy stats={start.stats} className="h-56 w-auto" />}
        {stage && <p className="font-heading font-semibold text-lg">{t.stages[stage.id]}</p>}
        <p>{to.story}</p>
        <p className="text-muted-foreground text-sm">{to.baseline}</p>
      </div>
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-panel border border-border bg-card p-5"
      >
        <h2 className="font-heading font-semibold text-xl">{to.signup}</h2>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {to.childName}
          <input name="childName" required maxLength={40} className={input} />
        </label>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {to.birthYear}
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
          {t.login.email}
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {to.passwordHint}
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
          {to.pin}
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
          {to.referral}
          <input name="referral" maxLength={40} className={input} />
          <span className="text-muted-foreground text-xs">{to.referralNote}</span>
        </label>
        <button type="button" className={outlineButton} onClick={() => setPhase("reveal")}>
          {to.back}
        </button>
        {error && (
          <p role="alert" className="rounded-xl bg-loss-wash p-3 text-sm">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={cn(primaryButton, "min-h-12")}>
          {to.create}
        </button>
      </form>
    </section>
  );
}
