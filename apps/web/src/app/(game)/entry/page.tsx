import type { Metadata } from "next";
import { EntryScreen } from "./EntryScreen";

export const metadata: Metadata = { title: "Entry" };

export default function EntryPage() {
  return <EntryScreen />;
}
