"use client";

import {
  DEFAULT_TIME_ZONE,
  type ParentFeedFilter,
  parentEnergyBand,
  parentFeedDays,
  parentWalletBreakdown,
  parentWeekReport,
  type StateSnapshot,
} from "@brainee/core";
import { allGames } from "@brainee/games";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { Brainy } from "@/components/Brainy";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { parentPatternsCopy as copy } from "./patterns-copy";

type Attention = { href: string; text: string };

export function ParentToday({
  snapshot,
  attention,
}: {
  snapshot: StateSnapshot;
  attention: Attention[];
}) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const { progress, showcase, latestGame, activity, child } = snapshot;
  const zone = showcase.calendar?.timeZone ?? DEFAULT_TIME_ZONE;
  const sessions = activity?.todaySessions ?? [];
  const pending = attention.filter((item) => !dismissed.includes(item.text));
  return (
    <section aria-labelledby="parent-today-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="parent-today-title" className="font-heading text-xl font-bold">
          {copy.today}
        </h2>
        <p className="text-sm text-muted-foreground">{child.name}</p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div
            data-testid="parent-energy"
            className="flex flex-col gap-4 rounded-stage bg-[#1C1B33] p-5 text-white shadow-[0_24px_40px_-26px_rgba(28,27,51,.6)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#CFCDE6]">{copy.energy}</span>
                <div className="flex items-baseline gap-2">
                  <strong className="font-display text-5xl text-[#B9A8FF]">{progress.mood}</strong>
                  <span className="text-sm text-[#CFCDE6]">{copy.outOf100}</span>
                </div>
                <span className="text-sm font-bold">
                  {copy.energyBands[parentEnergyBand(progress.mood)]}
                </span>
              </div>
              <div className="flex size-28 shrink-0 items-center justify-center rounded-full bg-[#F2F1FA]">
                <Brainy
                  stats={progress.stats}
                  mood={progress.mood}
                  earned={showcase.earned}
                  equipped={showcase.equipped}
                  animate
                  className="w-[124px] max-w-none"
                />
              </div>
            </div>
            <div>
              <meter
                className="sr-only"
                aria-label={copy.energyScale}
                value={progress.mood}
                min={0}
                max={100}
              />
              <div className="grid grid-cols-10 gap-1" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-2 rounded-sm",
                      i < Math.ceil(progress.mood / 10) ? "bg-[#B9A8FF]" : "bg-[#4A4570]",
                    )}
                  />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1 text-[10px] text-[#CFCDE6]">
                {copy.scale.map((label) => (
                  <span key={label} className="last:text-right">
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span data-testid="parent-stars" className="rounded-full bg-[#2E2B55] px-3 py-1.5">
                ★ {progress.wallet.stars}
              </span>
              <span className="rounded-full bg-[#2E2B55] px-3 py-1.5">
                ☀ {progress.wallet.suns}
              </span>
              {latestGame && (
                <span
                  data-testid="parent-latest-game"
                  className="rounded-full bg-[#2E2B55] px-3 py-1.5 text-[#CFCDE6]"
                >
                  {latestGame.title} · {t.child.game.level(latestGame.level)} · +
                  {latestGame.starsEarned}★
                </span>
              )}
            </div>
          </div>
          {pending.length > 0 && (
            <section
              data-testid="needs-attention"
              className="flex flex-col gap-3 rounded-row bg-loss-wash p-4"
            >
              <h3 className="text-xs font-bold uppercase tracking-wide text-coral">
                {t.parent.attention.title}
              </h3>
              {pending.map((item) => (
                <div key={item.text} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <Link href={item.href} className={cn(primaryButton, "justify-start")}>
                    {item.text}
                  </Link>
                  <button
                    type="button"
                    className={cn(outlineButton, "bg-transparent")}
                    onClick={() => setDismissed((items) => [...items, item.text])}
                  >
                    {copy.later}
                  </button>
                </div>
              ))}
            </section>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <section
            data-testid="parent-sessions"
            className="overflow-hidden rounded-row bg-card ring-1 ring-border"
          >
            <div className="flex items-baseline justify-between gap-3 px-4 py-3">
              <h3 className="font-semibold">{copy.sessions}</h3>
              <span className="text-xs text-muted-foreground">
                {copy.sessionCount(sessions.length)}
              </span>
            </div>
            {sessions.length === 0 ? (
              <p className="border-t border-border px-4 py-5 text-sm text-muted-foreground">
                {copy.noSessions}
              </p>
            ) : (
              <ol className="max-h-80 overflow-y-auto">
                {sessions.map((session) => {
                  const game = allGames.find((item) => item.id === session.gameId);
                  return (
                    <li
                      key={`${session.gameId}-${session.startedAt}-${session.finishedAt}`}
                      className="flex items-center gap-3 border-t border-border px-4 py-3"
                    >
                      <time
                        dateTime={new Date(session.finishedAt as number).toISOString()}
                        className="shrink-0 text-xs tabular-nums text-muted-foreground"
                      >
                        {new Date(session.finishedAt as number).toLocaleTimeString("en-US", {
                          timeZone: zone,
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {game ? game.title : copy.learningSession}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {copy.minutes(Math.round((session.durationMs ?? 0) / 60000))} ·{" "}
                          {session.recommended ? copy.recommended : copy.ownChoice}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md bg-gain-wash px-2 py-1 text-xs font-bold text-mint">
                        +{session.starsEarned ?? 0} ★
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
          <Link
            href="/tasks"
            className="flex min-h-20 items-center justify-between gap-3 rounded-row bg-card p-4 ring-1 ring-border"
          >
            <span>
              <span className="block font-semibold">{copy.tasks}</span>
              <span className="text-sm text-muted-foreground">
                {copy.tasksDone(
                  showcase.tasks.filter((task) => task.status === "done").length,
                  showcase.tasks.length,
                )}
              </span>
            </span>
            <span className="text-sm font-semibold text-accent">{copy.viewTasks} →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ParentWeek({ snapshot }: { snapshot: StateSnapshot }) {
  const [selected, setSelected] = useState(0);
  const report = parentWeekReport(snapshot.activity);
  const day = report.days[selected] ?? report.days[0];
  const remaining = snapshot.showcase.tasks.filter((task) => task.status !== "done").length;
  return (
    <section data-testid="parent-week" className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-bold">{copy.week}</h2>
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="flex flex-col gap-4 rounded-stage bg-[#1C1B33] p-4 text-white">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[#FF9EC2]">
              <strong className="font-display text-3xl">{Math.round(report.total)}</strong>
              <span className="ml-1 text-sm">{copy.minuteUnit}</span>
            </span>
            <span className="max-w-40 text-right text-xs text-[#CFCDE6]">{copy.weekActivity}</span>
          </div>
          <fieldset aria-label={copy.weekActivity} className="grid grid-cols-7 gap-1">
            {report.days.map((item, index) => (
              <button
                key={copy.weekDays[index]}
                type="button"
                aria-label={copy.weekDays[index]}
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
                className={cn(
                  "flex min-h-36 flex-col items-center justify-end gap-2 rounded-xl px-1 py-2",
                  selected === index ? "bg-[#2E2B55]" : "hover:bg-[#2E2B55]/50",
                )}
              >
                <span
                  className="flex h-20 w-full max-w-8 items-end rounded-md bg-white/5"
                  aria-hidden="true"
                >
                  <span
                    className="w-full rounded-md bg-[#B9A8FF]"
                    style={{
                      height: `${Math.max(item.total > 0 ? 6 : 2, (item.total / report.max) * 100)}%`,
                    }}
                  />
                </span>
                <span className="font-display text-[10px] text-[#FF9EC2]">
                  {Math.round(item.total)}
                </span>
                <span className="text-xs font-bold">{copy.weekDays[index]}</span>
              </button>
            ))}
          </fieldset>
          <div
            data-testid="parent-day-detail"
            className="rounded-row bg-[#2E2B55] px-3 py-3 text-sm"
            aria-live="polite"
          >
            <strong>{copy.weekDays[selected]}</strong>
            <p className="mt-1 text-xs text-[#CFCDE6]">
              {day && day.total > 0
                ? copy.dayDetail(Math.round(day.learning), Math.round(day.science))
                : copy.noDayActivity}
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-5 rounded-row bg-card p-5 ring-1 ring-border">
          <div className="border-l-[3px] border-accent pl-3">
            <h3 className="font-bold">{copy.wentWell}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {report.total > 0 ? copy.weekWin(Math.round(report.total)) : copy.weekStart}
            </p>
          </div>
          <div className="border-l-[3px] border-coral pl-3">
            <h3 className="font-bold">{copy.toWorkOn}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {remaining > 0 ? copy.taskPrompt(remaining) : copy.practicePrompt}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ParentFeed({ snapshot }: { snapshot: StateSnapshot }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<ParentFeedFilter>("all");
  const zone = snapshot.showcase.calendar?.timeZone ?? DEFAULT_TIME_ZONE;
  const occurrences = new Map<string, number>();
  const days = parentFeedDays(snapshot.showcase.feed, zone, filter).map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const identity = JSON.stringify([item.at, item.kind, item.title, item.amount]);
      const occurrence = occurrences.get(identity) ?? 0;
      occurrences.set(identity, occurrence + 1);
      return { item, key: `${identity}-${occurrence}` };
    }),
  }));
  return (
    <Panel title={t.parent.feed.title}>
      <fieldset aria-label={copy.feedFilters} className="flex flex-wrap gap-2">
        {(Object.keys(copy.filters) as ParentFeedFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={cn(
              "min-h-11 rounded-lg border px-3 text-sm font-semibold",
              filter === key ? "border-accent bg-violet-wash text-accent" : "border-border bg-card",
            )}
          >
            {copy.filters[key]}
          </button>
        ))}
      </fieldset>
      {days.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {snapshot.showcase.feed.length === 0 ? t.parent.feed.empty : copy.emptyFilter}
        </p>
      ) : (
        <ol data-testid="event-feed" className="flex flex-col gap-3">
          {days.map(({ day, items }) => (
            <li key={day} className="overflow-hidden rounded-row ring-1 ring-border">
              <h3 className="bg-background px-4 py-3 text-sm font-semibold text-muted-foreground">
                {new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
                  timeZone: "UTC",
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </h3>
              <ol>
                {items.map(({ item, key }) => (
                  <li
                    key={key}
                    className="flex items-center gap-3 border-t border-border px-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {t.parent.feed.kinds[item.kind]?.(item.title ?? "", item.amount ?? 0)}
                      </span>
                      <span data-testid="event-source" className="text-xs text-muted-foreground">
                        {copy.sources[item.kind]}
                      </span>
                    </span>
                    <time
                      dateTime={item.at}
                      className="shrink-0 text-xs tabular-nums text-muted-foreground"
                    >
                      {new Date(item.at).toLocaleTimeString("en-US", {
                        timeZone: zone,
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function RewardBreakdown({ snapshot }: { snapshot: StateSnapshot }) {
  const report = parentWalletBreakdown(snapshot.progress.wallet, snapshot.showcase);
  return (
    <section data-testid="reward-breakdown" className="flex flex-col gap-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {(["stars", "suns"] as const).map((currency) => (
          <article
            key={currency}
            data-testid={`breakdown-${currency}`}
            className="rounded-stage bg-[#1C1B33] p-5 text-white"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-[#CFCDE6]">{copy[currency]}</h2>
                <p className="mt-2 text-3xl text-[#FF9EC2]">
                  <span className="font-display">{report[currency].balance}</span>{" "}
                  <span aria-hidden="true">{currency === "stars" ? "★" : "☀"}</span>
                </p>
                <p className="mt-1 text-xs text-[#CFCDE6]">{copy.balance}</p>
              </div>
            </div>
            <dl className="mt-4 flex flex-col gap-2 border-t border-white/15 pt-4 text-xs">
              {(["other", "earned", "spent"] as const).map((kind) => (
                <div key={kind} className="flex items-baseline justify-between gap-3">
                  <dt className="text-[#CFCDE6]">{copy[kind]}</dt>
                  <dd className="shrink-0 font-bold tabular-nums">
                    {kind === "earned" ? "+" : kind === "spent" ? "−" : ""}
                    {report[currency][kind]}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{copy.breakdownNote}</p>
    </section>
  );
}
