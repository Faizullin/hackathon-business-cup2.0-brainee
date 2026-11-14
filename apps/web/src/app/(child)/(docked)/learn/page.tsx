import { reactGames } from "@brainee/games";
import { Card, CardDescription, CardHeader } from "@brainee/ui/components/card";
import { ChildIcon } from "@brainee/ui/components/child-icons";
import type { Metadata } from "next";
import Link from "next/link";
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
      <section aria-labelledby="all-games" className="flex flex-col gap-3">
        <h2 id="all-games" className="font-heading text-lg font-semibold">
          {ru.learn.allGames}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {reactGames.map((game) => (
            <li key={game.id}>
              <Link
                href={`/game/${game.id}`}
                className="flex min-h-32 flex-col justify-between gap-3 rounded-panel border border-border bg-card p-4 transition-transform duration-(--dur-press) active:scale-[0.97]"
              >
                <ChildIcon name="learn" className="size-10 text-sky" />
                <span>
                  <span className="block font-semibold">{game.title}</span>
                  <span className="text-muted-foreground text-sm">
                    {ru.skills[game.skills.main as keyof typeof ru.skills] ?? game.skills.main}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
