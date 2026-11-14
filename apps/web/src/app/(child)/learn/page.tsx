import { Card, CardDescription, CardHeader } from "@brainee/ui/components/card";
import type { Metadata } from "next";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.learn.title };

export default function LearnPage() {
  return (
    <Card>
      <CardHeader>
        <h1>{ru.learn.title}</h1>
        <CardDescription className="mt-1 max-w-prose text-base">
          {ru.learn.description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
