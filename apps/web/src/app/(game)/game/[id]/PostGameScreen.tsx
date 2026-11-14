"use client";

import { Brainy } from "@brainee/brainy";
import { type LearningCompletion, practiceGame } from "@brainee/core";
import { type GameDefinition, reactGames } from "@brainee/games";
import { StarIcon } from "@brainee/ui/components/child-icons";
import { ArrowRight } from "@brainee/ui/components/icons";
import { buttonVariants } from "@brainee/ui/lib/button-variants";
import Link from "next/link";
import { useDemoProgress } from "@/components/child/DemoProgressProvider";
import { ru } from "@/i18n/ru";
import { demoChild } from "@/lib/demo-child";

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
  const { stop } = useDemoProgress();
  const t = ru.child.game;
  const practice = practiceGame(completion.after.stats, reactGames);
  const nextLevel = level < game.levels ? level + 1 : 1;
  const card =
    "flex min-h-28 flex-col justify-center gap-2 rounded-panel border border-border bg-card p-4 text-left transition-transform duration-(--dur-press) active:scale-[0.97]";
  return (
    <section data-testid="post-game" className="flex flex-col gap-5 p-4 pb-8 sm:p-6">
      <div className="text-center">
        <p className="text-muted-foreground">{game.title}</p>
        <h1 className="mt-1">{t.done}</h1>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-panel border border-border bg-card p-3 sm:p-5">
        {(["before", "after"] as const).map((when, index) => (
          <figure
            key={when}
            className={index === 1 ? "col-start-3 row-start-1" : "col-start-1 row-start-1"}
          >
            <Brainy
              stats={completion[when].stats}
              equipped={demoChild.equipped}
              label={t[when]}
              className="mx-auto h-auto w-full max-w-48"
            />
            <figcaption className="text-center text-sm font-semibold">{t[when]}</figcaption>
          </figure>
        ))}
        <ArrowRight aria-hidden="true" className="col-start-2 row-start-1 size-6 text-mint" />
      </div>
      <div className="flex flex-wrap justify-center gap-2" aria-live="polite">
        {Object.entries(completion.gains).map(([stat, gain]) => (
          <p
            key={stat}
            data-testid={`stat-gain-${stat}`}
            className="rounded-full bg-mint/15 px-4 py-2 font-semibold"
          >
            {ru.lab.brainy.statNames[stat as keyof typeof ru.lab.brainy.statNames]} +{gain}
            <span className="ml-2 text-sm font-normal">
              {completion.before.stats[stat as keyof typeof completion.gains]} →{" "}
              {completion.after.stats[stat as keyof typeof completion.gains]}
            </span>
          </p>
        ))}
        {Object.keys(completion.gains).length === 0 && <p>{t.statsUnchanged}</p>}
      </div>
      <div className="text-center">
        <p
          className="flex items-center justify-center gap-2 font-heading text-2xl font-semibold"
          data-testid="earned-stars"
        >
          <StarIcon className="size-7" />+{completion.earnedStars}
        </p>
        <p className="mt-1 text-sm">{t.starsEarned(completion.gameStars)}</p>
        <p className="text-muted-foreground text-sm">{t.balance(completion.after.wallet.stars)}</p>
      </div>
      {completion.suggestBreak && (
        <aside
          data-testid="break-suggestion"
          className="flex flex-col items-center gap-3 rounded-panel border border-mint bg-mint/10 p-4 text-center"
        >
          <h2 className="font-heading font-semibold">{t.breakTitle}</h2>
          {completion.bonus > 0 && <p data-testid="streak-bonus">{t.bonus(completion.bonus)}</p>}
          <Link href="/brainy" onClick={stop} className={buttonVariants({ size: "child" })}>
            {t.breakAction}
          </Link>
        </aside>
      )}
      <section aria-labelledby="next-steps" className="flex flex-col gap-3">
        <h2 id="next-steps" className="font-heading text-lg font-semibold">
          {t.next}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {practice && (
            <Link
              href={`/game/${practice.id}?level=1&seed=${seed + 1}`}
              className={card}
              data-testid="practice-game"
            >
              <span className="text-sm text-mint">{t.practice}</span>
              <strong>{practice.title}</strong>
              <span className="text-muted-foreground text-sm">
                {ru.skills[practice.skills.main as keyof typeof ru.skills]}
              </span>
            </Link>
          )}
          <Link
            href={`/game/${game.id}?level=${nextLevel}&seed=${seed + 1}`}
            className={card}
            data-testid="next-level"
          >
            <span className="text-sm text-sky">{level < game.levels ? t.nextLevel : t.replay}</span>
            <strong>{game.title}</strong>
            <span className="text-muted-foreground text-sm">{t.level(nextLevel)}</span>
          </Link>
        </div>
      </section>
      <Link
        href="/brainy"
        onClick={stop}
        className={buttonVariants({ variant: "secondary", size: "child" })}
      >
        {t.enough}
      </Link>
    </section>
  );
}
