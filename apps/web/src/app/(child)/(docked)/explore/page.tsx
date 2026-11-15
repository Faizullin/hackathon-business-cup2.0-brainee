"use client";
import { useCatalog } from "@brainee/games";
import Link from "next/link";
import { GameThumbnail } from "@/components/child/GameThumbnail";
import { useLearning } from "@/components/child/LearningProvider";
import { useI18n } from "@/i18n";
export default function ExplorePage() {
  const { previews } = useCatalog();
  const { t } = useI18n();
  const { snapshot } = useLearning();
  const age = snapshot ? new Date().getFullYear() - snapshot.child.birthYear : 0;
  return (
    <>
      <h1>Explore</h1>
      <p>No stars or scores. Experiment and create at your own pace.</p>
      <Link
        href="/learn"
        className="min-h-12 rounded-xl bg-primary px-4 py-3 text-primary-foreground"
      >
        Back to learning
      </Link>
      <div className="grid gap-4 sm:grid-cols-2">
        {previews.map((game) =>
          age < game.minAge ? (
            <div
              key={game.id}
              aria-disabled="true"
              className="flex flex-col gap-3 rounded-panel border border-border bg-card p-4 text-muted-foreground"
            >
              <GameThumbnail src={game.thumbnail} locked />
              <h2>{game.title}</h2>
              <p>{t.learn.lockedAge(game.minAge)}</p>
            </div>
          ) : (
            <Link
              key={game.id}
              href={`/explore/${game.id}`}
              className="flex flex-col gap-3 rounded-panel border border-border bg-card p-4"
            >
              <GameThumbnail src={game.thumbnail} />
              <h2>{game.title}</h2>
              <p>{game.minAge}+ · Free play · no stars</p>
            </Link>
          ),
        )}
      </div>
    </>
  );
}
