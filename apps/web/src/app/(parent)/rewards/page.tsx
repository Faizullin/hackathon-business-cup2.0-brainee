import type { Metadata } from "next";
import { RewardsScreen } from "@/components/parent/RewardsScreen";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.parent.rewards.title };

export default function Page() {
  return <RewardsScreen />;
}
