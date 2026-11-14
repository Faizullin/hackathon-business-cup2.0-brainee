import { getGame } from "@brainee/games";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "./GamePlayer";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ level?: string; seed?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = getGame((await params).id);
  return { title: game?.title };
}

export default async function GamePage({ params, searchParams }: Props) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();
  const query = await searchParams;
  const level = Number(query.level) || 1;
  // A fresh seed per visit unless one is given (?seed= replays a board).
  const seed = Number(query.seed) || Math.floor(Math.random() * 1_000_000);
  return <GamePlayer gameId={game.id} level={level} seed={seed} />;
}
