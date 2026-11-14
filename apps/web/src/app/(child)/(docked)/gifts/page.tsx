import type { Metadata } from "next";
import { GiftsScreen } from "@/components/child/GiftsScreen";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.child.gifts.title };

export default function GiftsPage() {
  return <GiftsScreen />;
}
