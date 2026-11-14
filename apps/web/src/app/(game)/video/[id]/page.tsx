import type { Metadata } from "next";
import { ru } from "@/i18n/ru";
import { VideoPlayer } from "./VideoPlayer";

export const metadata: Metadata = { title: ru.child.leisure.science };

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  return <VideoPlayer id={(await params).id} />;
}
