import { Card, CardDescription, CardHeader } from "@brainee/ui/components/card";
import type { Metadata } from "next";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.analytics.title };

export default function AnalyticsPage() {
  return (
    <Card>
      <CardHeader>
        <h1>{ru.analytics.title}</h1>
        <CardDescription className="mt-1 max-w-prose text-base">
          {ru.analytics.description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
