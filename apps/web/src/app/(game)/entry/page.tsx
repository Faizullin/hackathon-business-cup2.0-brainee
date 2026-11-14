import type { Metadata } from "next";
import { ru } from "@/i18n/ru";
import { EntryScreen } from "./EntryScreen";

export const metadata: Metadata = { title: ru.child.entry.title };

export default function EntryPage() {
  return <EntryScreen />;
}
