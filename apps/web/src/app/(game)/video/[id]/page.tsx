import type { Metadata } from "next";
import { VideoPlayer } from "./VideoPlayer";

export const metadata: Metadata = { title: "Science" };

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  return <VideoPlayer id={(await params).id} />;
}
