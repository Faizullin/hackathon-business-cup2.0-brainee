import type { Metadata } from "next";
import { LeisureScreen } from "@/components/child/LeisureScreen";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.child.leisure.title };

export default function LeisurePage() {
  return <LeisureScreen />;
}
