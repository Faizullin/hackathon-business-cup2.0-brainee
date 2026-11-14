import type { Metadata } from "next";
import { BrainyProfile } from "@/components/child/BrainyProfile";

export const metadata: Metadata = { title: "Brainy" };
export default function BrainyPage() {
  return <BrainyProfile />;
}
