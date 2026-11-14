import type { Metadata } from "next";
import { GiftsScreen } from "@/components/child/GiftsScreen";

export const metadata: Metadata = { title: "Gifts" };

export default function GiftsPage() {
  return <GiftsScreen />;
}
