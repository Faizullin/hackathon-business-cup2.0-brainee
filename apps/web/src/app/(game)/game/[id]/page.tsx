import { runtimeCatalog } from "@/lib/server/remote-games";
export const dynamic = "force-dynamic";

import { clampLevel } from "@brainee/games";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "./GamePlayer";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ level?: string; seed?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const awaitedId = (await params).id;
  const game = (await runtimeCatalog()).games.find((g) => g.id === awaitedId);
  return { title: game?.title };
}

export default async function GamePage({ params, searchParams }: Props) {
  const { id } = await params;
  const game = (await runtimeCatalog()).games.find((g) => g.id === id);
  if (!game) notFound();
  const query = await searchParams;
  const level = clampLevel(Number(query.level) || 1, game.levels);
  // The launch API chooses the seed unless the URL asks for a replay.
  const requestedSeed = Number(query.seed);
  const seed =
    query.seed !== undefined &&
    Number.isSafeInteger(requestedSeed) &&
    requestedSeed >= 0 &&
    requestedSeed <= 0xffffffff
      ? requestedSeed
      : undefined;
  return (
    <GamePlayer
      key={`${game.id}:${level}:${seed}`}
      gameId={game.id}
      level={level}
      seed={seed}
      remoteGame={
        game.source === "remote"
          ? { ...game, runtime: "embedded", runtimeUrl: game.entry }
          : undefined
      }
    />
  );
}
