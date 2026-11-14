import { previews } from "@brainee/game-catalog";
import { notFound } from "next/navigation";
import { ExplorePlayer } from "./ExplorePlayer";
export default async function ExploreGame({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = previews.find((g) => g.id === id);
  if (!game) notFound();
  return <ExplorePlayer game={game} />;
}
