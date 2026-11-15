"use client";

import { ABILITIES, stageOf } from "@brainee/core";
import { Share2 } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { Brainy } from "@/components/Brainy";
import { useLearning } from "@/components/child/LearningProvider";
import { Chip, outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { FamilyPlanCard } from "@/components/family-plan/FamilyPlanCard";
import { useI18n } from "@/i18n";
import { Bars, Legend, Radar } from "./charts";
import { ParentFeed, ParentToday, ParentWeek } from "./ParentPatterns";

type Scope = "district" | "city" | "country";
type Kind = "growth" | "absolute";

// D-29: saved activity metrics; illustrative historical/character radars and ranking.
export function AnalyticsScreen() {
  const { snapshot } = useLearning();
  const { t: i18n } = useI18n();
  const t = i18n.analytics;
  const [scope, setScope] = useState<Scope>("district");
  const [kind, setKind] = useState<Kind>("growth");
  const [shared, setShared] = useState(false);
  if (!snapshot) return null;
  const { child, progress, showcase } = snapshot;
  const live = snapshot.activity;
  const seeded = showcase.analytics;
  const a = live
    ? {
        ...seeded,
        metrics: {
          ...seeded.metrics,
          focusMinutes: live.focusMinutes,
          focusDelta: i18n.liveAnalytics.saved,
          streakDays: live.streakDays,
          streakNote: i18n.liveAnalytics.saved,
          takesRecommendation: live.takesRecommendation,
          recommendationDelta: i18n.liveAnalytics.entries(live.took, live.entries),
        },
        week: {
          ...seeded.week,
          learning: live.learning,
          science: live.science,
          fun: [0, 0, 0, 0, 0, 0, 0],
        },
        hardThing: {
          weeks: [t.now],
          share: [live.takesRecommendation],
          finished: live.recommendedFinished,
          recommended: live.recommendedStarted,
        },
      }
    : seeded;
  const stage = stageOf(progress.stats);
  const table = a.ranking[scope][kind];
  // D-23: the "now" outline is the child's live ability scores, moved by every finished game.
  const skillsNow = ABILITIES.map((skill) => Math.round(progress.skills[skill]));
  const toConfirm = showcase.tasks.filter((task) => task.status === "check").length;
  const toDeliver = showcase.requests.filter((request) => !request.delivered).length;
  const attention = [
    toConfirm > 0 && { href: "/tasks", text: i18n.parent.attention.confirm(toConfirm) },
    toDeliver > 0 && { href: "/rewards", text: i18n.parent.attention.deliver(toDeliver) },
    showcase.tasks.length === 0 && { href: "/tasks", text: i18n.parent.attention.assign },
  ].filter(Boolean) as { href: string; text: string }[];
  const share = async () => {
    const text = `${t.recap(a.recap.month)} · ${child.name}: ${a.recap.achievements.join(", ")}. ${t.referral(a.recap.referral)}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setShared(true);
    } catch {
      /* Share sheet dismissed. */
    }
  };
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1>{t.title}</h1>
        <Chip tone="sun">{t.demoNote}</Chip>
      </div>

      <ParentToday snapshot={snapshot} attention={attention} />
      <ParentWeek snapshot={snapshot} />

      <p className="text-sm text-muted-foreground" data-testid="computed-analytics">
        {i18n.liveAnalytics.note}
      </p>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [t.focus, t.focusValue(a.metrics.focusMinutes), a.metrics.focusDelta],
          [t.streak, String(a.metrics.streakDays), a.metrics.streakNote],
          [
            t.sunsWeek,
            `${showcase.weekGoal.earned} / ${showcase.weekGoal.target}`,
            showcase.gifts.find((g) => g.id === showcase.weekGoal.giftId)?.title ?? "",
          ],
          [t.takesAdvice, `${a.metrics.takesRecommendation}%`, a.metrics.recommendationDelta],
        ].map(([title, value, note]) => (
          <li
            key={title}
            className="flex flex-col gap-1 rounded-panel border border-border bg-card p-4"
          >
            <span className="text-muted-foreground text-xs">{title}</span>
            <span className="font-heading font-semibold text-2xl">{value}</span>
            <span className="text-mint text-xs font-medium">{note}</span>
          </li>
        ))}
      </ul>

      <p className="rounded-panel border border-coral/30 bg-loss-wash p-4">
        {t.insight(
          a.insight.improved,
          a.insight.improvedDelta,
          a.insight.lagging,
          a.insight.value,
          a.insight.average,
        )}{" "}
        <Link
          href="/tasks"
          className="font-semibold text-accent underline-offset-4 hover:underline"
        >
          {t.insightLink}
        </Link>
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t.skills} note={t.skillsNote}>
          <Radar
            label={t.skills}
            labels={a.skills.labels}
            series={[
              { values: a.skills.monthAgo, color: "sky" },
              { values: skillsNow, color: "accent" },
            ]}
            average={a.skills.average}
          />
          <Legend
            items={[
              { label: t.now, color: "accent" },
              { label: t.monthAgo, color: "sky" },
              { label: t.average, dashed: true },
            ]}
          />
        </Panel>
        <Panel title={t.character} note={t.characterNote}>
          <Radar
            label={t.character}
            labels={a.character.labels}
            series={[
              { values: a.character.monthAgo, color: "sky" },
              { values: a.character.now, color: "mint" },
            ]}
          />
          <Legend
            items={[
              { label: t.now, color: "mint" },
              { label: t.monthAgo, color: "sky" },
            ]}
          />
        </Panel>
        <Panel title={t.hard} note={i18n.liveAnalytics.recommended}>
          <Bars
            label={t.hard}
            categories={a.hardThing.weeks}
            stacks={[{ values: a.hardThing.share, color: "mint" }]}
            max={100}
            unit="%"
          />
          <p className="text-sm">{t.hardDone(a.hardThing.finished, a.hardThing.recommended)}</p>
        </Panel>
      </div>

      <ParentFeed snapshot={snapshot} />
      <FamilyPlanCard />

      <Panel title={t.ranking} note={t.rankingNote}>
        <div className="flex flex-wrap gap-2">
          <fieldset className="flex gap-1 rounded-xl bg-secondary p-1">
            {(Object.keys(t.scopes) as Scope[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={scope === key}
                onClick={() => setScope(key)}
                className={cn(
                  "rounded-lg px-3 py-2 font-semibold text-sm",
                  scope === key && "bg-card shadow-sm",
                )}
              >
                {t.scopes[key]}
              </button>
            ))}
          </fieldset>
          <fieldset className="flex gap-1 rounded-xl bg-secondary p-1">
            {(Object.keys(t.kinds) as Kind[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={kind === key}
                onClick={() => setKind(key)}
                className={cn(
                  "rounded-lg px-3 py-2 font-semibold text-sm",
                  kind === key && "bg-card shadow-sm",
                )}
              >
                {t.kinds[key]}
              </button>
            ))}
          </fieldset>
        </div>
        <p className="font-semibold">{table.summary}</p>
        <ol className="flex flex-col gap-1">
          {table.rows.map((row) => (
            <li
              key={row.place}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2",
                row.me ? "bg-highlight-wash font-semibold" : "bg-secondary/50",
              )}
            >
              <span className="w-12 text-muted-foreground">{row.place}</span>
              <span className="flex-1">{row.name}</span>
              <span>{row.value}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel>
        <div className="flex flex-col items-center gap-3 rounded-xl bg-gradient-to-br from-highlight-wash via-violet-wash to-gain-wash p-5 text-center sm:flex-row sm:text-left">
          <Brainy
            stats={progress.stats}
            equipped={showcase.equipped}
            label=""
            className="h-32 w-auto"
          />
          <div className="flex flex-1 flex-col gap-2">
            <h2 className="font-heading font-semibold text-lg">{t.recap(a.recap.month)}</h2>
            <p className="font-semibold">
              {child.name} · {i18n.stages[stage.id]}
            </p>
            <ul className="text-sm">
              {a.recap.achievements.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="text-muted-foreground text-xs">{t.referral(a.recap.referral)}</p>
          </div>
          <button type="button" onClick={share} className={shared ? outlineButton : primaryButton}>
            <Share2 aria-hidden="true" className="size-4" />
            {shared ? t.copied : t.share}
          </button>
        </div>
      </Panel>
    </>
  );
}
