import { hasFilm } from "@brainee/films";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoPlayer } from "./VideoPlayer";

export const metadata: Metadata = { title: "Science" };

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Only science entries with a real film have a page; there is no placeholder player.
  if (!hasFilm(id)) notFound();
  return <VideoPlayer id={id} />;
}
