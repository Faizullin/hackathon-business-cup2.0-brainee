import type { Metadata } from "next";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.analytics.title };

export default function AnalyticsPage() {
  return (
    <section className="rounded-panel border border-line bg-surface p-5 sm:p-8">
      <h1>{ru.analytics.title}</h1>
      <p className="mt-3 max-w-prose text-muted">{ru.analytics.description}</p>
    </section>
  );
}
