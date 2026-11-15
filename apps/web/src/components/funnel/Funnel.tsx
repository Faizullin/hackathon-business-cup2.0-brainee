"use client";
import { BRAINY_PRESETS, Brainy } from "@brainee/brainy";
import {
  choiceLabel,
  coverAngles,
  entryFor,
  type FunnelDraft,
  type FunnelQuestionId,
  pauseFor,
  planFor,
  profileFor,
  question,
  ROUTE,
  reachable,
  weekFor,
} from "@brainee/core";
import { AnswerGroup } from "@brainee/ui/components/answer-group";
import { Dialog } from "@brainee/ui/components/dialog";
import { StepPage } from "@brainee/ui/components/step-page";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { primaryButton, smallButton } from "@/components/demo/kit";
import { AnswerSummary } from "./AnswerSummary";
import { funnelCopy as c } from "./copy";
import { GrowthDemo, MatchDemo, MatchTarget } from "./DemoMoments";
import { loadFunnel, saveFunnel } from "./storage";

export function Funnel() {
  const [screen, setScreen] = useState("cover");
  const [answers, setAnswers] = useState<FunnelDraft>({});
  const [ready, setReady] = useState(false);
  const [angle, setAngle] = useState<keyof typeof coverAngles>("default");
  const [tour, setTour] = useState(false);
  const [editing, setEditing] = useState(false);
  const current = useRef(answers);
  const navigate = useCallback((target: string, replace = false, draft = current.current) => {
    const next = reachable(target, draft);
    window.history[replace ? "replaceState" : "pushState"](
      {},
      "",
      `${window.location.pathname}${window.location.search}#${next}`,
    );
    setScreen(next);
    saveFunnel(next, draft);
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const saved = loadFunnel();
    current.current = saved.answers;
    setAnswers(saved.answers);
    const params = new URLSearchParams(window.location.search);
    const value = params.get("angle");
    if (value && Object.hasOwn(coverAngles, value)) setAngle(value as keyof typeof coverAngles);
    setTour(params.get("tour") === "1");
    navigate(window.location.hash.slice(1) || saved.screen, true, saved.answers);
    setReady(true);
    const onHash = () => navigate(window.location.hash.slice(1), true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // Navigation reads current answers from the ref, including browser Back.
  }, [navigate]);
  if (!ready) return <p>{c.loading}</p>;
  const q = question(screen);
  const index = ROUTE.indexOf(screen);
  const profile = profileFor(answers);
  const plan = planFor(answers);
  const cover = coverAngles[angle];
  const story = c.stories[screen];
  const insight =
    screen === "pause"
      ? pauseFor(answers)
      : screen === "week"
        ? weekFor(answers.duration ?? "varies")
        : null;
  const title =
    q?.title ??
    story?.[0] ??
    insight?.title ??
    (screen === "cover"
      ? cover.title
      : screen === "outside"
        ? c.outside
        : screen === "profile"
          ? profile?.title
          : screen === "result"
            ? plan?.title
            : screen === "offer"
              ? c.pending
              : screen === "method"
                ? plan?.feature
                : c.quote) ??
    c.saved;
  const body =
    q?.hint ??
    story?.[1] ??
    insight?.body ??
    (screen === "cover"
      ? cover.body
      : screen === "outside"
        ? c.outsideBody
        : screen === "profile"
          ? profile?.why
          : screen === "result"
            ? plan?.intro
            : screen === "offer"
              ? c.pendingBody
              : screen === "method"
                ? plan?.benefit
                : plan?.cue);
  const update = (value: string) => {
    if (!q) return;
    const draft = { ...answers, [q.id]: value };
    current.current = draft;
    setAnswers(draft);
    saveFunnel(screen, draft);
  };
  const signup = `/signup${tour ? "?tour=1" : ""}`;
  const next = () => {
    if (screen === "outside") {
      navigate("age");
      return;
    }
    if (screen === "offer") {
      window.location.assign(signup);
      return;
    }
    if (screen === "age" && answers.age === "outside") {
      navigate("outside");
      return;
    }
    if (editing) {
      setEditing(false);
      navigate("profile");
      return;
    }
    navigate(
      screen === "cover" && Object.keys(answers).length
        ? entryFor(answers, loadFunnel().resumeAt)
        : (ROUTE[index + 1] ?? "offer"),
    );
  };
  return (
    <div data-testid="parent-funnel" data-step={screen}>
      <StepPage
        step={screen}
        total={{ current: Math.max(0, index), count: ROUTE.length - 1 }}
        chapter={
          index < 1
            ? c.forParents
            : index < 7
              ? c.meet
              : index < 15
                ? c.family
                : index < 22
                  ? c.starting
                  : c.first
        }
        title={title}
        body={body}
        artClassName={["cover", "result", "offer"].includes(screen) ? "!bg-[#1c1b33]" : ""}
        art={
          screen === "growth" ? (
            <GrowthDemo />
          ) : screen === "match" ? (
            <MatchTarget />
          ) : (
            <div className="flex w-full flex-col items-center justify-center gap-3 rounded-stage">
              <Brainy
                stats={screen === "growth" ? BRAINY_PRESETS.now : BRAINY_PRESETS.afterQuiz}
                mood={92}
                animate
                label={c.meet}
                className={q ? "w-16 lg:w-64" : "w-40 lg:w-64"}
              />
              {screen === "reward" && <span className="font-display text-4xl text-sun">★</span>}
              {screen === "benefits" && (
                <span className="font-display text-4xl text-sun">★ + ☀</span>
              )}
            </div>
          )
        }
        onBack={
          screen !== "cover"
            ? () =>
                navigate(screen === "outside" ? "age" : (ROUTE[Math.max(0, index - 1)] ?? "cover"))
            : undefined
        }
        onContinue={next}
        continueLabel={
          screen === "cover"
            ? Object.keys(answers).length
              ? c.resume
              : c.start
            : screen === "outside"
              ? c.chooseAge
              : screen === "offer"
                ? c.signup
                : c.continue
        }
        backLabel={c.back}
        progressLabel={c.progress}
        disabled={Boolean(q && !choiceLabel(q.id, answers[q.id]))}
      >
        {screen === "match" && <MatchDemo />}
        {q && (
          <AnswerGroup
            label={q.title}
            options={q.options}
            value={answers[q.id]}
            onChange={update}
          />
        )}
        {screen === "profile" && (
          <>
            <p className="rounded-panel bg-violet-wash p-4">{profile?.lever}</p>
            <AnswerSummary
              answers={answers}
              onChange={(id: FunnelQuestionId) => {
                setEditing(true);
                navigate(id);
              }}
            />
          </>
        )}
        {screen === "result" && plan && (
          <div className="space-y-3">
            <blockquote className="rounded-panel bg-highlight-wash p-4 font-bold">
              {plan.cue}
            </blockquote>
            {plan.steps.map((step, i) => (
              <div key={step.label} className="rounded-panel bg-card p-4 ring-1 ring-border">
                <p className="text-sm text-accent">
                  {i + 1}. {step.label}
                </p>
                <h2 className="text-lg">{step.title}</h2>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
            <p>
              <strong>{c.notice}: </strong>
              {plan.check}
            </p>
          </div>
        )}
        {screen === "example" && plan && (
          <p className="rounded-panel bg-highlight-wash p-4">{plan.steps[3]?.body}</p>
        )}
        {screen === "outside" && (
          <Link href="/" className={smallButton}>
            {c.home}
          </Link>
        )}
      </StepPage>
      <Dialog.Root>
        <Dialog.Trigger className="min-h-11 text-sm text-accent">{c.privacy}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/30" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,480px)] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-stage bg-card p-6">
            <Dialog.Title className="font-heading text-xl">{c.privacy}</Dialog.Title>
            <Dialog.Description>{c.privacyBody}</Dialog.Description>
            <Dialog.Close className={primaryButton}>{c.close}</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
