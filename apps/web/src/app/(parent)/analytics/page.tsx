import type { Metadata } from "next";
import { AnalyticsScreen } from "@/components/parent/AnalyticsScreen";

export const metadata: Metadata = { title: "Analytics" };

export default function Page() {
  return <AnalyticsScreen />;
}
