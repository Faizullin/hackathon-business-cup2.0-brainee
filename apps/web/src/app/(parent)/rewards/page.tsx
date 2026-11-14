import type { Metadata } from "next";
import { RewardsScreen } from "@/components/parent/RewardsScreen";

export const metadata: Metadata = { title: "Rewards" };

export default function Page() {
  return <RewardsScreen />;
}
