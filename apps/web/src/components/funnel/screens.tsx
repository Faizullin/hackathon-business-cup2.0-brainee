"use client";
import {
  ANNUAL,
  type BrainyStats,
  clock,
  commercialPlans,
  funnelSignals,
  money,
  type PlanChoice,
  planLegal,
  type QuizDraft,
  STAGES,
  STARTER_DEADLINE_KEY,
  STARTER_MS,
  stagePreviewStats,
  starterLeft,
} from "@brainee/core";
import { useEffect, useRef, useState } from "react";
import { FunnelBrain } from "./BrainPanel";
import { Icon, type IconName } from "./Icon";
import { ageLabel, quizCopy as c, type Opt } from "./quiz-copy";

export type Names = { kid: string; Kid: string };

/** A title whose middle part is emphasised: [before, emphasised, after]. */
export function Head({
  title,
  sub,
  kicker,
  as: Tag = "h1",
}: {
  title: string | readonly [string, string, string];
  sub?: string;
  kicker?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="head">
      {kicker && <p className="kicker">{kicker}</p>}
      <Tag>
        {typeof title === "string" ? (
          title
        ) : (
          <>
            {title[0]}
            <em>{title[1]}</em>
            {title[2]}
          </>
        )}
      </Tag>
      {sub && <p className="sub">{sub}</p>}
    </div>
  );
}

const Go = ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" className="primary" {...rest}>
    {children}
    <Icon name="arrow" />
  </button>
);

/** One answer per screen; picking an answer moves on by itself. */
export function SingleScreen({
  kicker,
  title,
  hint,
  options,
  value,
  dark,
  onPick,
}: {
  kicker?: string;
  title: string;
  hint?: string;
  options: readonly Opt[];
  value?: string;
  dark?: boolean;
  onPick: (value: string) => void;
}) {
  return (
    <main className={`card${dark ? " dark" : ""}`} id="main-content" tabIndex={-1}>
      <Head title={title} sub={hint} kicker={kicker} />
      <fieldset className="body" aria-label={title}>
        {options.map(([v, label]) => (
          <button
            key={v}
            type="button"
            className={`answer${value === v ? " on" : ""}`}
            aria-pressed={value === v}
            data-value={v}
            onClick={() => onPick(v)}
          >
            <span className="mark" />
            {label}
          </button>
        ))}
      </fieldset>
      {dark && <p className="fine">{c.legal}</p>}
    </main>
  );
}

export function MultiScreen({
  title,
  hint,
  options,
  value = [],
  onChange,
  onContinue,
}: {
  title: string;
  hint: string;
  options: readonly Opt[];
  value?: string[];
  onChange: (value: string[]) => void;
  onContinue: () => void;
}) {
  const toggle = (v: string) =>
    onChange(
      v === "none"
        ? value.includes("none")
          ? []
          : ["none"]
        : value.includes(v)
          ? value.filter((x) => x !== v)
          : [...value.filter((x) => x !== "none"), v],
    );
  return (
    <main className="card" id="main-content" tabIndex={-1}>
      <Head title={title} sub={hint} />
      <fieldset className="body multi" aria-label={title}>
        {options.map(([v, label]) => (
          <button
            key={v}
            type="button"
            className={`answer${value.includes(v) ? " on" : ""}`}
            aria-pressed={value.includes(v)}
            data-value={v}
            onClick={() => toggle(v)}
          >
            <span className="mark" />
            {label}
          </button>
        ))}
      </fieldset>
      <div className="actions">
        <Go disabled={!value.length} onClick={onContinue}>
          {c.continue}
        </Go>
      </div>
    </main>
  );
}

export function ChildScreen({
  draft,
  onName,
  onAge,
  onContinue,
}: {
  draft: QuizDraft;
  onName: (value: string) => void;
  onAge: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <main className="card" id="main-content" tabIndex={-1}>
      <Head title={c.child.title} sub={c.child.hint} />
      <div className="body">
        <div className="field">
          <label htmlFor="funnel-name">{c.child.nameLabel}</label>
          <input
            id="funnel-name"
            className="input"
            placeholder={c.child.namePlaceholder}
            maxLength={20}
            autoComplete="off"
            defaultValue={draft.name ?? ""}
            onChange={(e) => onName(e.target.value)}
          />
        </div>
        <fieldset className="field">
          <legend>{c.child.ageLabel}</legend>
          <div className="chips">
            {c.child.ages.map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={`answer${draft.age === v ? " on" : ""}`}
                aria-pressed={draft.age === v}
                data-age={v}
                onClick={() => onAge(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="actions">
        <Go disabled={!draft.age} onClick={onContinue}>
          {c.continue}
        </Go>
      </div>
    </main>
  );
}

export function ExitScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "done" | "invalid">("idle");
  return (
    <main className="card" id="main-content" tabIndex={-1} data-testid="funnel-exit">
      <Head title={c.exit.title} sub={c.exit.hint} />
      <form
        className="body"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setState("invalid");
          try {
            window.localStorage.setItem("brainy.notify-me", email.trim());
          } catch {}
          setState("done");
        }}
      >
        <input
          className="input"
          type="email"
          aria-label="Email"
          placeholder={c.exit.email}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="primary">
          {c.exit.notify}
        </button>
        {state === "invalid" && (
          <p className="error" role="alert">
            {c.exit.invalid}
          </p>
        )}
        {state === "done" && (
          <p className="fine" role="status">
            {c.exit.thanks}
          </p>
        )}
        <button type="button" className="text-button" onClick={onBack}>
          {c.exit.change}
        </button>
      </form>
    </main>
  );
}

export function ScaleScreen({
  statement,
  value,
  onPick,
}: {
  statement: string;
  value?: number;
  onPick: (n: number) => void;
}) {
  return (
    <main className="card" id="main-content" tabIndex={-1}>
      <div className="head">
        <p className="kicker">{c.scale.kicker}</p>
      </div>
      <h1 className="statement">“{statement}”</h1>
      <fieldset className="scale" aria-label={statement}>
        <div className="scale-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={value === n ? "on" : ""}
              aria-pressed={value === n}
              data-n={n}
              onClick={() => onPick(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="scale-ends">
          <span>{c.scale.low}</span>
          <span>{c.scale.high}</span>
        </div>
      </fieldset>
    </main>
  );
}

/** Progress rows that run on their own. `pauseAt` opens a question at about half of row 2. */
export function LoaderScreen({
  title,
  rows,
  quote,
  ask,
  onAnswer,
  onDone,
}: {
  title: string;
  rows: readonly string[];
  quote?: boolean;
  ask?: string;
  onAnswer?: (yes: boolean) => void;
  onDone: () => void;
}) {
  const [at, setAt] = useState({ row: 0, pct: 0 });
  const [paused, setPaused] = useState(false);
  const asked = useRef(false);
  const done = useRef(onDone);
  done.current = onDone;
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (paused) return;
    if (at.row >= rows.length) {
      const t = setTimeout(() => done.current(), 300);
      return () => clearTimeout(t);
    }
    if (ask && !asked.current && at.row === 1 && at.pct >= 48) {
      asked.current = true;
      setPaused(true);
      return;
    }
    const t = setTimeout(() => {
      setAt(({ row, pct }) => (pct + 4 > 100 ? { row: row + 1, pct: 0 } : { row, pct: pct + 4 }));
    }, 34);
    return () => clearTimeout(t);
  }, [at, paused, rows.length, ask]);
  useEffect(() => {
    if (paused && !dialog.current?.open) dialog.current?.showModal();
  }, [paused]);
  const answer = (yes: boolean) => {
    onAnswer?.(yes);
    dialog.current?.close();
    setPaused(false);
  };
  return (
    <main className="card" id="main-content" tabIndex={-1} data-testid="funnel-loader">
      <Head title={title} />
      <div className="load">
        {rows.map((label, i) => {
          const pct = i < at.row ? 100 : i === at.row ? at.pct : 0;
          return (
            <div key={label}>
              <div className="load-top">
                {label}
                <span>{pct}%</span>
              </div>
              <div className="load-track">
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {quote && (
        <div className="quote">
          {c.analyze.quote}
          <small>{c.analyze.quoteBy}</small>
        </div>
      )}
      {ask && (
        <dialog
          ref={dialog}
          className="ask"
          aria-labelledby="funnel-ask"
          onCancel={(e) => e.preventDefault()}
        >
          <p className="kicker">{c.build.quick}</p>
          <h2 id="funnel-ask">{ask}</h2>
          <div className="row">
            <button type="button" className="primary ghost" onClick={() => answer(false)}>
              {c.build.no}
            </button>
            <button type="button" className="primary" onClick={() => answer(true)}>
              {c.build.yes}
            </button>
          </div>
        </dialog>
      )}
    </main>
  );
}

const barColor = (v: number) => (v < 45 ? "#FF6F8E" : v < 70 ? "#FFAE1A" : "#8C76FF");

export function RevealScreen({
  names,
  draft,
  stats,
  health,
  onContinue,
}: {
  names: Names;
  draft: QuizDraft;
  stats: BrainyStats;
  health: number;
  onContinue: () => void;
}) {
  return (
    <main className="spread" id="main-content" tabIndex={-1}>
      <div className="art">
        <span className="kicker">{c.reveal.kicker}</span>
        <div className="disc" role="img" aria-label={c.reveal.alt(names.Kid)}>
          <FunnelBrain stats={stats} health={health} />
        </div>
        <div className="score" data-testid="reveal-score" data-score={health}>
          <b>{health}</b>
          <span>{c.panel.score}</span>
        </div>
      </div>
      <div className="copy">
        <Head title={c.reveal.title(names.Kid)} sub={c.reveal.sub} />
        <div className="signals">
          {funnelSignals(draft).map((s) => (
            <div key={s.id}>
              <div className="sig-top">
                {c.reveal.signals[s.id]}
                <span>{c.reveal.levels[s.level]}</span>
              </div>
              <div className="sig-track">
                <i style={{ width: `${s.value}%`, background: barColor(s.value) }} />
                <u style={{ left: "72%" }} />
              </div>
            </div>
          ))}
          <span className="sig-key">{c.reveal.key(ageLabel(draft.age))}</span>
        </div>
        <div className="actions">
          <Go onClick={onContinue}>{c.reveal.cta}</Go>
        </div>
      </div>
    </main>
  );
}

export function OnTimeScreen({ names, onContinue }: { names: Names; onContinue: () => void }) {
  return (
    <main className="spread" id="main-content" tabIndex={-1}>
      <div className="art">
        <span className="kicker">{c.ontime.kicker}</span>
        <figure className="story-art sa-feed" role="img" aria-label={c.ontime.art}>
          <div className="sa-picture" aria-hidden="true">
            <div className="sa-feed-stack">
              <div />
              <div />
              <div>
                <i className="sa-play" />
                <i className="sa-playback" />
              </div>
            </div>
          </div>
        </figure>
      </div>
      <div className="copy">
        <Head title={c.ontime.title} sub={c.ontime.sub(names.kid)} />
        <div className="stat">
          <b>{c.ontime.stat}</b>
          <span>
            {c.ontime.statBody}
            <small>{c.ontime.source}</small>
          </span>
        </div>
        <div className="actions">
          <Go onClick={onContinue}>{c.continue}</Go>
        </div>
      </div>
    </main>
  );
}

/** Mood rises left to right so the first stage shows the full rot and the last one sparkles. */
const STAGE_MOODS = [14, 34, 52, 72, 92] as const;

export function SolutionScreen({
  names,
  stageIndex,
  onContinue,
}: {
  names: Names;
  stageIndex: number;
  onContinue: () => void;
}) {
  const goal = Math.min(STAGES.length - 1, stageIndex + 2);
  return (
    <main className="card" id="main-content" tabIndex={-1}>
      <Head title={c.solution.title(names.kid)} />
      <div className="stages">
        {STAGES.map((stage, i) => (
          <figure key={stage.id} className={i < stageIndex ? "dim" : ""} data-stage={stage.id}>
            {i === stageIndex ? (
              <span className="pin">{c.solution.today(names.Kid)}</span>
            ) : i === goal ? (
              <span className="pin goal">{c.solution.weeks}</span>
            ) : null}
            <FunnelBrain stats={stagePreviewStats(stage.id)} health={STAGE_MOODS[i] ?? 50} />
            <figcaption className="fine">{c.solution.stages[i]}</figcaption>
          </figure>
        ))}
      </div>
      <div className="stage-line" />
      <div className="trio">
        {c.solution.trio.map(([icon, head, body]) => (
          <div key={head}>
            <strong>
              <Icon name={icon as IconName} />
              {head}
            </strong>
            <p>{body}</p>
          </div>
        ))}
      </div>
      <div className="actions">
        <Go onClick={onContinue}>{c.solution.cta(names.kid)}</Go>
      </div>
    </main>
  );
}

export function GiftScreen({
  names,
  value,
  onPick,
}: {
  names: Names;
  value?: string;
  onPick: (value: string) => void;
}) {
  return (
    <main className="card" id="main-content" tabIndex={-1}>
      <Head title={c.gift.title(names.kid)} sub={c.gift.hint} />
      <fieldset className="tiles" aria-label={c.gift.title(names.kid)}>
        {c.gift.tiles.map(([id, icon, n, label]) => (
          <button
            key={id}
            type="button"
            className={`tile${value === id ? " on" : ""}`}
            aria-pressed={value === id}
            data-gift={id}
            onClick={() => onPick(id)}
          >
            <Icon name={icon as IconName} />
            <b>
              {n}
              <Icon name="sun" />
            </b>
            {label}
          </button>
        ))}
        <button
          type="button"
          className={`tile light${value === "later" ? " on" : ""}`}
          aria-pressed={value === "later"}
          data-gift="later"
          onClick={() => onPick("later")}
        >
          <Icon name="gift" />
          <b>&nbsp;</b>
          {c.gift.later}
        </button>
      </fieldset>
    </main>
  );
}

export function EmailScreen({
  names,
  value,
  onChange,
  onContinue,
}: {
  names: Names;
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
}) {
  const [error, setError] = useState(false);
  const submit = () => {
    const v = value.trim();
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setError(true);
    onContinue();
  };
  return (
    <main className="card" id="main-content" tabIndex={-1}>
      <Head title={c.email.title(names.kid)} />
      <form
        className="body"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          className="input"
          type="email"
          aria-label="Email"
          placeholder={c.email.placeholder}
          autoComplete="email"
          value={value}
          onChange={(e) => {
            setError(false);
            onChange(e.target.value);
          }}
        />
        {error && (
          <p className="error" role="alert">
            {c.email.invalid}
          </p>
        )}
        <p className="fine">{c.email.fine}</p>
      </form>
      <div className="actions">
        <Go onClick={submit}>{c.continue}</Go>
      </div>
    </main>
  );
}

/** The honest Starter Pack timer: 15 minutes from the first offer view, never reset. */
export function useStarterClock(active: boolean) {
  const memory = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [deadline, setDeadline] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let value = 0;
    try {
      value = Number(window.localStorage.getItem(STARTER_DEADLINE_KEY));
      if (!Number.isFinite(value) || value <= 0) {
        value = Date.now() + STARTER_MS;
        window.localStorage.setItem(STARTER_DEADLINE_KEY, String(value));
      }
    } catch {
      memory.current ??= Date.now() + STARTER_MS;
      value = memory.current;
    }
    setDeadline(value);
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  const left = deadline === null ? STARTER_MS / 1000 : starterLeft(deadline, now);
  return { left, expired: deadline !== null && left <= 0 };
}

export function OfferStrip({ left, expired }: { left: number; expired: boolean }) {
  return (
    <div className={`offer-strip${expired ? " over" : ""}`} data-testid="starter-strip">
      {expired ? (
        c.offer.expired
      ) : (
        <>
          <Icon name="cape" />
          {c.offer.strip}
          <span className="clock" data-testid="starter-clock">
            {clock(left)}
          </span>
        </>
      )}
    </div>
  );
}

export function OfferScreen({
  names,
  draft,
  todayStats,
  futureStats,
  health,
  plan,
  expired,
  busy,
  error,
  onPlan,
  onStart,
}: {
  names: Names;
  draft: QuizDraft;
  todayStats: BrainyStats;
  futureStats: BrainyStats;
  health: number;
  plan: PlanChoice;
  expired: boolean;
  busy: boolean;
  error: boolean;
  onPlan: (plan: PlanChoice) => void;
  onStart: () => void;
}) {
  const p = commercialPlans();
  const rows = c.offer.includes(draft.minutes ?? "15", names.kid);
  return (
    <main className="spread offer" id="main-content" tabIndex={-1}>
      <div className="art">
        <h1 className="offer-title">
          {c.offer.ready(names.Kid)[0]}
          <em>{c.offer.ready(names.Kid)[1]}</em>
        </h1>
        <div className="ba">
          <div>
            <div className="disc">
              <FunnelBrain stats={todayStats} health={health} />
            </div>
            <small>
              {c.offer.today} · {health}
            </small>
          </div>
          <Icon name="arrow" />
          <div>
            <div className="disc">
              <FunnelBrain stats={futureStats} health={92} />
            </div>
            <small>{c.offer.weeks}</small>
          </div>
        </div>
        <ul className="incl">
          {rows.map(([icon, text]) => (
            <li key={icon}>
              <Icon name={icon as IconName} />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <div className="copy">
        <fieldset className="plans" aria-label={c.offer.planGroup}>
          <button
            type="button"
            className={`plan${plan === "annual" ? " on" : ""}`}
            aria-pressed={plan === "annual"}
            data-plan="annual"
            onClick={() => onPlan("annual")}
          >
            <span className="tag best">{c.offer.best}</span>
            <span className="tag save">{c.offer.save(p.annual.savePercent)}</span>
            <span className="mark" />
            <span>
              <span className="plan-name">{c.offer.yearly}</span>
              <span className="plan-terms">
                <b>{money(p.annual.perMonth)}</b> {c.offer.perMonthBilledYearly}
              </span>
            </span>
            <span className="price">
              <s>{money(p.annual.strike)}</s>
              <b>{money(ANNUAL)}</b>
              <small>{c.offer.perYear}</small>
            </span>
          </button>
          <button
            type="button"
            className={`plan${plan === "monthly" ? " on" : ""}`}
            aria-pressed={plan === "monthly"}
            data-plan="monthly"
            onClick={() => onPlan("monthly")}
          >
            <span className="mark" />
            <span>
              <span className="plan-name">{c.offer.monthly}</span>
              <span className="plan-terms">
                {money(p.monthly.perYear)} {c.offer.aYear}
              </span>
            </span>
            <span className="price">
              <b>{money(p.monthly.price)}</b>
              <small>{c.offer.perMonth}</small>
            </span>
          </button>
        </fieldset>
        <div className={`bonus${expired ? " gone" : ""}`} data-testid="starter-bonus">
          <Icon name="cape" />
          <span>
            <b>{c.offer.bonusLead}</b>
            {c.offer.bonus}
          </span>
        </div>
        <button
          type="button"
          className="primary"
          disabled={busy}
          onClick={onStart}
          data-testid="start-plan"
        >
          {busy ? c.offer.starting : c.offer.cta(names.kid)}
          <Icon name="arrow" />
        </button>
        {error && (
          <p className="error" role="alert">
            {c.offer.error}
          </p>
        )}
        <p className="legal">{planLegal(plan)}</p>
      </div>
    </main>
  );
}
