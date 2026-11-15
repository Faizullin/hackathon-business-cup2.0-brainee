"use client";

import { type LearningCompletion, practiceGame } from "@brainee/core";
import { type GameDefinition, useCatalog } from "@brainee/games";
import { StarIcon } from "@brainee/ui/components/child-icons";
import { ArrowRight } from "@brainee/ui/components/icons";
import Link from "next/link";
import { useRef } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Brainy } from "@/components/Brainy";
import { useLearning } from "@/components/child/LearningProvider";
import { StopLearningButton } from "@/components/child/StopLearningButton";
import { stoppingCopy } from "@/components/child/stopping-copy";
import { StoppingPhrase } from "@/components/family-plan/StoppingPhrase";
import { RewardFlight } from "@/components/RewardFlight";
import { useI18n } from "@/i18n";

export function PostGameScreen({
  game,
  level,
  seed,
  completion,
}: {
  game: GameDefinition;
  level: number;
  seed: number;
  completion: LearningCompletion;
}) {
  const { games: allGames } = useCatalog();
  const rewardRef = useRef<HTMLParagraphElement>(null);
  const walletRef = useRef<HTMLParagraphElement>(null);
  const { snapshot } = useLearning();
  const { t: i18n } = useI18n();
  const t = i18n.child.game;
  // T-94: prefer a different game for the weak skill; fall back to this one if it's the only fit.
  const practice =
    practiceGame(
      completion.after.stats,
      allGames.filter((other) => other.id !== game.id),
    ) ?? practiceGame(completion.after.stats, allGames);
  const nextLevel = level < game.levels ? level + 1 : 1;
  const card =
    "flex min-h-28 flex-col justify-center ui-panel rounded-panel ring-1 ring-border bg-card text-left transition-transform duration-(--dur-press) active:scale-[0.97]";
  return (
    <section
      data-testid="post-game"
      data-mode="child"
      className="ui-surface ui-stack mx-auto grid w-full max-w-6xl p-(--ui-page-padding) pb-8 lg:grid-cols-2 lg:items-start"
    >
      <div className="text-center lg:col-span-2">
        <p className="text-muted-foreground">{game.title}</p>
        <h1 className="mt-1">{t.done}</h1>
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-stage bg-card p-3 ring-1 ring-border sm:p-5">
          {(["before", "after"] as const).map((when, index) => (
            <figure
              key={when}
              className={index === 1 ? "col-start-3 row-start-1" : "col-start-1 row-start-1"}
            >
              <Brainy
                stats={completion[when].stats}
                mood={completion[when].mood}
                earned={snapshot?.showcase.earned}
                equipped={snapshot?.showcase.equipped ?? {}}
                label={t[when]}
                className="mx-auto h-auto w-full max-w-48"
              />
              <figcaption className="text-center text-sm font-semibold">{t[when]}</figcaption>
            </figure>
          ))}
          <ArrowRight aria-hidden="true" className="col-start-2 row-start-1 size-6 text-mint" />
        </div>
        {Object.keys(completion.skillGains ?? {}).length > 0 && (
          <p className="flex flex-wrap justify-center gap-2 text-sm" data-testid="skill-gains">
            {Object.entries(completion.skillGains).map(([skill, gain]) => (
              <span
                key={skill}
                className="lv-gainA rounded-full bg-gain-wash px-3 py-1 font-medium"
              >
                {t.skillGain(
                  i18n.skills[skill as keyof typeof i18n.skills] ?? skill,
                  gain as number,
                )}
              </span>
            ))}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2 " aria-live="polite">
          {Object.entries(completion.gains).map(([stat, gain]) => (
            <p
              key={stat}
              data-testid={`stat-gain-${stat}`}
              className="lv-gainB rounded-full bg-violet-wash px-4 py-2 font-semibold"
            >
              {i18n.lab.brainy.statNames[stat as keyof typeof i18n.lab.brainy.statNames]} +{gain}
              <span className="ml-2 text-sm font-normal">
                {completion.before.stats[stat as keyof typeof completion.gains]} →{" "}
                {completion.after.stats[stat as keyof typeof completion.gains]}
              </span>
            </p>
          ))}
          {Object.keys(completion.gains).length === 0 && <p>{t.statsUnchanged}</p>}
        </div>
        <div className="rounded-stage bg-card p-5 text-center ring-1 ring-border">
          <p
            className="lv-bub mx-auto flex w-fit items-center justify-center gap-2 rounded-full bg-highlight px-6 py-3 font-display text-3xl text-[#1c1b33]"
            data-testid="earned-stars"
            ref={rewardRef}
          >
            <StarIcon className="size-7" />+{completion.earnedStars}
          </p>
          <p className="mt-1 text-sm">{t.starsEarned(completion.gameStars)}</p>
          <p ref={walletRef} className="text-muted-foreground text-sm">
            <AnimatedNumber
              value={snapshot?.progress.wallet.stars ?? completion.after.wallet.stars}
              from={completion.before.wallet.stars}
              format={t.balance}
            />
          </p>
          <RewardFlight from={rewardRef} to={walletRef} />
        </div>
        <div className="flex flex-col gap-3">
          {!completion.suggestBreak && <StoppingPhrase />}
          <StopLearningButton href="/brainy">{t.enough}</StopLearningButton>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        {completion.suggestBreak && (
          <aside
            data-testid="break-suggestion"
            className="flex flex-col items-center gap-4 rounded-stage bg-[#1c1b33] p-6 text-center text-white shadow-xl shadow-[#1c1b33]/15"
          >
            <Brainy
              stats={completion.after.stats}
              mood={completion.after.mood}
              equipped={snapshot?.showcase.equipped ?? {}}
              earned={snapshot?.showcase.earned}
              className="h-32 w-32 rounded-full bg-[#f2f1fa]"
            />
            <h2 className="font-heading text-xl">{t.breakTitle}</h2>
            <p className="text-sm text-[#cfcde6]">{stoppingCopy.breakReason}</p>
            <StoppingPhrase />
            {completion.bonus > 0 && <p data-testid="streak-bonus">{t.bonus(completion.bonus)}</p>}
            <StopLearningButton href="/brainy" variant="default">
              {t.breakAction}
            </StopLearningButton>
            <p className="text-xs text-[#cfcde6]">{stoppingCopy.available}</p>
          </aside>
        )}
        <section aria-labelledby="next-steps" className="flex flex-col gap-3 ">
          <h2 id="next-steps" className="font-heading text-lg font-semibold">
            {t.next}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {practice && (
              <Link
                href={`/game/${practice.id}?level=1&seed=${(seed + 1) >>> 0}`}
                className={card}
                data-testid="practice-game"
              >
                <span className="text-sm text-mint">{t.practice}</span>
                <strong>{practice.title}</strong>
                <span className="text-muted-foreground text-sm">
                  {i18n.skills[practice.skills.main as keyof typeof i18n.skills]}
                </span>
              </Link>
            )}
            <Link
              href={`/game/${game.id}?level=${nextLevel}&seed=${(seed + 1) >>> 0}`}
              className={card}
              data-testid="next-level"
            >
              <span className="text-sm text-sky">
                {level < game.levels ? t.nextLevel : t.replay}
              </span>
              <strong>{game.title}</strong>
              <span className="text-muted-foreground text-sm">{t.level(nextLevel)}</span>
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
