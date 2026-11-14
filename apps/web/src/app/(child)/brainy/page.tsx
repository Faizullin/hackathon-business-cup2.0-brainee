import type { Metadata } from "next";
import { BrainyProfile } from "@/components/child/BrainyProfile";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.child.tabs.brainy };
export default function BrainyPage() {
  return <BrainyProfile />;
}
