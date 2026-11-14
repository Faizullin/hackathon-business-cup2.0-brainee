import { Card, CardDescription, CardHeader } from "@brainee/ui/components/card";
import type { Metadata } from "next";
import { GameGrid } from "@/components/child/GameGrid";
import { RecommendationCards } from "@/components/child/Recommendations";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.learn.title };

export default function LearnPage() {
  return (
    <>
      <Card>
        <CardHeader>
          <h1>{ru.learn.title}</h1>
          <CardDescription className="mt-1 max-w-prose text-base">
            {ru.learn.description}
          </CardDescription>
        </CardHeader>
      </Card>
      <section aria-labelledby="advice" className="flex flex-col gap-3">
        <h2 id="advice" className="font-heading text-lg font-semibold">
          {ru.child.advice}
        </h2>
        <RecommendationCards />
      </section>
      <section aria-labelledby="all-games" className="flex flex-col gap-3">
        <h2 id="all-games" className="font-heading text-lg font-semibold">
          {ru.learn.allGames}
        </h2>
        <GameGrid />
      </section>
    </>
  );
}
