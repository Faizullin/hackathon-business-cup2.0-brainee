"use client";
import {
  BEHAVIOUR_IDS,
  type BehaviourId,
  cleanName,
  drainOf,
  funnelBodyStats,
  funnelHealth,
  type PlanChoice,
  QUIZ_SCREENS,
  type QuizDraft,
  type QuizScreen,
  reachable,
  SCREEN_SECTION,
  STAGES,
  stageOf,
  stagePreviewStats,
} from "@brainee/core";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { enterJury } from "@/lib/jury";
import { BrainPanel, FunnelBrain } from "./BrainPanel";
import { Icon } from "./Icon";
import { quizCopy as c } from "./quiz-copy";
import {
  ChildScreen,
  EmailScreen,
  ExitScreen,
  GiftScreen,
  LoaderScreen,
  MultiScreen,
  OfferScreen,
  OfferStrip,
  OnTimeScreen,
  RevealScreen,
  ScaleScreen,
  SingleScreen,
  SolutionScreen,
  useStarterClock,
} from "./screens";
import { loadFunnel, resetFunnel, saveFunnel } from "./storage";
import "./funnel.css";

type Screen = QuizScreen | "exit";
const LOADERS = new Set<string>(["analyze", "build"]);
const WITH_BRAIN = new Set<string>([
  "duration",
  "content",
  "finish",
  "handoff",
  "reading",
  "child",
  "guilt",
  "limits",
  "attempt",
  "analyze",
]);
const SINGLE: BehaviourId[] = BEHAVIOUR_IDS;

/** The screen before this one, skipping the self-running loaders. */
function previous(screen: Screen): Screen | null {
  if (screen === "exit") return "child";
  let i = QUIZ_SCREENS.indexOf(screen) - 1;
  while (i >= 0 && LOADERS.has(QUIZ_SCREENS[i] as string)) i--;
  return QUIZ_SCREENS[i] ?? null;
}
const following = (screen: Screen): Screen =>
  screen === "exit" ? "child" : (QUIZ_SCREENS[QUIZ_SCREENS.indexOf(screen) + 1] ?? "offer");

export function Funnel() {
  const [ready, setReady] = useState(false);
  const [family, setFamily] = useState(false);
  const [screen, setScreen] = useState<Screen>("duration");
  const [draft, setDraftState] = useState<QuizDraft>({});
  const [delta, setDelta] = useState(0);
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState(false);
  const [juryBusy, setJuryBusy] = useState(false);
  const [juryError, setJuryError] = useState(false);
  const current = useRef<QuizDraft>({});
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deltaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenRef = useRef<Screen>("duration");
  const clock = useStarterClock(screen === "offer");

  const clearPending = useCallback(() => {
    if (pending.current) clearTimeout(pending.current);
    pending.current = null;
  }, []);
  const navigate = useCallback(
    (target: string, replace = false, d: QuizDraft = current.current) => {
      clearPending();
      const next = reachable(target, d);
      window.history[replace ? "replaceState" : "pushState"](
        {},
        "",
        `${window.location.pathname}${window.location.search}#${next}`,
      );
      screenRef.current = next;
      setScreen(next);
      saveFunnel(next, d);
      window.scrollTo(0, 0);
    },
    [clearPending],
  );
  const patch = useCallback((change: Partial<QuizDraft>) => {
    const d = { ...current.current, ...change };
    current.current = d;
    setDraftState(d);
    saveFunnel(screenRef.current, d);
    return d;
  }, []);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams(window.location.search);
    const reset = params.get("reset") === "1";
    const tour = params.get("tour") === "1";
    if (reset) resetFunnel();
    const boot = async () => {
      let paired = false;
      if (!reset && !tour) {
        try {
          const r = await fetch("/api/device");
          paired = r.ok && !!(await r.json()).paired;
        } catch {}
      }
      if (!alive) return;
      const saved = loadFunnel();
      current.current = saved.draft;
      setDraftState(saved.draft);
      setFamily(paired);
      navigate(window.location.hash.slice(1) || saved.screen, true, saved.draft);
      setReady(true);
    };
    void boot();
    const onHash = () => {
      let target = reachable(window.location.hash.slice(1), current.current);
      // Browser Back must not land on a loader that would run forward again.
      if (
        LOADERS.has(target) &&
        QUIZ_SCREENS.indexOf(target as QuizScreen) <
          QUIZ_SCREENS.indexOf(screenRef.current as QuizScreen)
      )
        target = previous(target) ?? "duration";
      navigate(target, true);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      alive = false;
      window.removeEventListener("hashchange", onHash);
      clearPending();
      if (deltaTimer.current) clearTimeout(deltaTimer.current);
    };
  }, [navigate, clearPending]);

  const health = useMemo(() => funnelHealth(draft), [draft]);
  const stats = useMemo(() => funnelBodyStats(draft), [draft]);
  const names = useMemo(() => {
    const n = cleanName(draft.name);
    return { kid: n || c.fallbackName, Kid: n || c.fallbackNameCap };
  }, [draft.name]);
  const stageIndex = stageOf(stats).index;

  const go = (target: string) => navigate(target);
  const advance = (from: Screen = screen) => go(following(from));
  const later = (fn: () => void, ms: number) => {
    clearPending();
    pending.current = setTimeout(fn, ms);
  };

  const pickBehaviour = (id: BehaviourId, value: string) => {
    const drop = Math.max(0, drainOf(id, value) - drainOf(id, current.current[id]));
    patch({ [id]: value } as Partial<QuizDraft>);
    if (deltaTimer.current) clearTimeout(deltaTimer.current);
    setDelta(drop);
    if (drop) deltaTimer.current = setTimeout(() => setDelta(0), 1100);
    const from = screen;
    later(() => advance(from), drop ? 750 : 300);
  };

  const startPlan = async () => {
    if (busy) return;
    setBusy(true);
    setStartError(false);
    try {
      const d = current.current;
      const r = await fetch("/api/onboarding/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnel: d,
          childName: d.name ?? "",
          email: d.email ?? "",
          plan: d.plan ?? "annual",
          starterPack: !clock.expired,
        }),
      });
      if (!r.ok) throw new Error("start-failed");
      const data = await r.json();
      try {
        sessionStorage.setItem("brainee-family-login", JSON.stringify(data.credentials));
      } catch {}
      window.location.assign("/entry");
    } catch {
      setStartError(true);
      setBusy(false);
    }
  };
  const jury = async () => {
    setJuryBusy(true);
    setJuryError(false);
    try {
      await enterJury();
    } catch {
      setJuryError(true);
      setJuryBusy(false);
    }
  };

  const header = (
    <>
      <header className="masthead shell">
        <span className="wordmark">
          <FunnelMark />
          {c.brand}
        </span>
        <span className="mast-desc">{c.forParents}</span>
        <button
          type="button"
          className="jury"
          disabled={juryBusy}
          onClick={jury}
          data-testid="jury-entry"
        >
          <Icon name="scale" />
          {c.jury}
          <small>{c.juryNote}</small>
        </button>
      </header>
      {juryError && (
        <p className="error shell" role="alert">
          {c.juryError}
        </p>
      )}
    </>
  );

  if (!ready)
    return (
      <div className="bc" data-testid="parent-funnel" data-step="loading">
        {header}
        <p className="fine">{c.loading}</p>
      </div>
    );

  if (family)
    return (
      <div className="bc" data-testid="parent-funnel" data-step="ready">
        {header}
        <main className="ready" id="main-content">
          <div className="disc">
            <FunnelBrain stats={stagePreviewStats("awake")} health={92} />
          </div>
          <h1 className="statement">{c.ready.title}</h1>
          <p className="fine">{c.ready.body}</p>
          <Link href="/entry" className="primary" data-testid="open-app">
            {c.ready.open}
            <Icon name="arrow" />
          </Link>
          <button
            type="button"
            className="text-button"
            data-testid="start-over"
            onClick={() => {
              resetFunnel();
              current.current = {};
              setDraftState({});
              setFamily(false);
              navigate("duration", true, {});
            }}
          >
            {c.ready.again}
          </button>
        </main>
      </div>
    );

  const section = SCREEN_SECTION[screen];
  const inSection = [...QUIZ_SCREENS, "exit" as const].filter((s) => SCREEN_SECTION[s] === section);
  const pos = Math.max(0, inSection.indexOf(screen));
  const offer = screen === "offer";
  const plan: PlanChoice = draft.plan ?? "annual";
  const back = previous(screen);
  const solo = !WITH_BRAIN.has(screen);
  const single = SINGLE.includes(screen as BehaviourId) ? (screen as BehaviourId) : null;
  const futureStats = stagePreviewStats(
    STAGES[Math.min(STAGES.length - 1, stageIndex + 2)]?.id ?? "genius",
  );

  const body = (() => {
    if (single) {
      const q = c.single[single];
      return (
        <SingleScreen
          kicker={"kicker" in q ? q.kicker : undefined}
          title={q.title}
          hint={q.hint}
          options={q.options}
          value={draft[single]}
          dark={single === "duration"}
          onPick={(v) => pickBehaviour(single, v)}
        />
      );
    }
    switch (screen) {
      case "child":
        return (
          <ChildScreen
            draft={draft}
            onName={(v) => patch({ name: cleanName(v) || undefined })}
            onAge={(v) => patch({ age: v as QuizDraft["age"] })}
            onContinue={() => go(current.current.age === "other" ? "exit" : "guilt")}
          />
        );
      case "exit":
        return <ExitScreen onBack={() => go("child")} />;
      case "guilt":
      case "limits":
        return (
          <ScaleScreen
            statement={c.scale[screen]}
            value={draft[screen]}
            onPick={(n) => {
              patch({ [screen]: n });
              later(() => advance(screen), 300);
            }}
          />
        );
      case "attempt":
        return (
          <MultiScreen
            title={c.attempt.title}
            hint={c.attempt.hint}
            options={c.attempt.options}
            value={draft.attempt}
            onChange={(v) => patch({ attempt: v })}
            onContinue={() => advance()}
          />
        );
      case "analyze":
        return (
          <LoaderScreen
            key="analyze"
            title={c.analyze.title(names.kid)}
            rows={c.analyze.rows}
            quote
            onDone={() => navigate("reveal", true)}
          />
        );
      case "reveal":
        return (
          <RevealScreen
            names={names}
            draft={draft}
            stats={stats}
            health={health}
            onContinue={() => advance()}
          />
        );
      case "ontime":
        return <OnTimeScreen names={names} onContinue={() => advance()} />;
      case "goal":
        return (
          <MultiScreen
            title={c.goal.title(names.kid)}
            hint={c.goal.hint}
            options={c.goal.options}
            value={draft.goal}
            onChange={(v) => patch({ goal: v })}
            onContinue={() => advance()}
          />
        );
      case "solution":
        return (
          <SolutionScreen names={names} stageIndex={stageIndex} onContinue={() => advance()} />
        );
      case "minutes":
        return (
          <SingleScreen
            title={c.single.minutes.title(names.kid)}
            hint={c.single.minutes.hint}
            options={c.single.minutes.options}
            value={draft.minutes}
            onPick={(v) => {
              patch({ minutes: v });
              later(() => advance("minutes"), 300);
            }}
          />
        );
      case "gift":
        return (
          <GiftScreen
            names={names}
            value={draft.gift}
            onPick={(v) => {
              patch({ gift: v });
              later(() => advance("gift"), 300);
            }}
          />
        );
      case "build":
        return (
          <LoaderScreen
            key="build"
            title={c.build.title(names.kid)}
            rows={c.build.rows}
            ask={c.build.ask(names.kid)}
            onAnswer={(yes) => patch({ earn: yes })}
            onDone={() => navigate("email", true)}
          />
        );
      case "email":
        return (
          <EmailScreen
            names={names}
            value={draft.email ?? ""}
            onChange={(v) => patch({ email: v.trim() ? v : undefined })}
            onContinue={() => advance()}
          />
        );
      case "offer":
        return (
          <OfferScreen
            names={names}
            draft={draft}
            todayStats={stats}
            futureStats={futureStats}
            health={health}
            plan={plan}
            expired={clock.expired}
            busy={busy}
            error={startError}
            onPlan={(p) => patch({ plan: p })}
            onStart={startPlan}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className="bc frame" data-testid="parent-funnel" data-step={screen}>
      {offer && <OfferStrip left={clock.left} expired={clock.expired} />}
      {header}
      {!offer && (
        <nav className="story-nav shell" aria-label={c.progress}>
          <button
            type="button"
            className={`back${back ? "" : " off"}`}
            onClick={() => back && go(back)}
            disabled={!back}
            data-testid="funnel-back"
          >
            <Icon name="arrow" />
            {c.back}
          </button>
          <div className="segs" data-testid="funnel-progress">
            {c.sections.map((label, i) => {
              const w =
                i < section
                  ? 100
                  : i > section
                    ? 0
                    : Math.round(((pos + 1) / inSection.length) * 100);
              return (
                <i key={label}>
                  <b style={{ width: `${w}%` }} />
                </i>
              );
            })}
          </div>
          <span className="nav-label">{c.sections[section]}</span>
        </nav>
      )}
      <div className={`stage shell${solo ? " solo" : ""}`}>
        {body}
        {!solo && <BrainPanel draft={draft} health={health} delta={delta} />}
      </div>
      <footer className="foot">
        <Link href="/login">{c.account}</Link>
      </footer>
    </div>
  );
}

/** Small wordmark glyph: our own origin, no image request. */
function FunnelMark() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="#5A3FE0" />
      <path
        d="M11 20c-1-5 2-9 7-9s8 4 7 9c-1 3-4 5-7 5s-6-2-7-5Z"
        fill="#FF9EC2"
        stroke="#1C1B33"
        strokeWidth="1.6"
      />
      <circle cx="15" cy="18" r="1.4" fill="#1C1B33" />
      <circle cx="21" cy="18" r="1.4" fill="#1C1B33" />
    </svg>
  );
}
