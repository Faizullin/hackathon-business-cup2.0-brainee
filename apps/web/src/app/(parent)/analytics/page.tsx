import type { Metadata } from "next";
import { AnalyticsScreen } from "@/components/parent/AnalyticsScreen";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.analytics.title };

export default function AnalyticsPage() {
  return <AnalyticsScreen />;
}
