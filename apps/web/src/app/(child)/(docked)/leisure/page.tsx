import type { Metadata } from "next";
import { LeisureScreen } from "@/components/child/LeisureScreen";

export const metadata: Metadata = { title: "Leisure" };

export default function LeisurePage() {
  return <LeisureScreen />;
}
