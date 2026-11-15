import type { Metadata } from "next";
import { Funnel } from "@/components/funnel/Funnel";

export const metadata: Metadata = { title: "1-minute brain check" };

export default function StartPage() {
  return <Funnel />;
}
