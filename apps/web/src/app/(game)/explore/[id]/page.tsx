import { runtimeCatalog } from "@/lib/server/remote-games";
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ExplorePlayer } from "./ExplorePlayer";
export default async function ExploreGame({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { previews } = await runtimeCatalog();
  const game = previews.find((g) => g.id === id);
  if (!game) notFound();
  return <ExplorePlayer game={game} />;
}
