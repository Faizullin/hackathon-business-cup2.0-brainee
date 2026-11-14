import type { Metadata } from "next";
import { LearnContent } from "@/components/child/LearnContent";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return <LearnContent />;
}
