import { Card, CardDescription, CardHeader } from "@brainee/ui/components/card";
import type { Metadata } from "next";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.child.gifts.title };

// Stub until T-38 (weekly goal, gift shop, tasks from mom, ☀→★ exchange).
export default function GiftsPage() {
  return (
    <Card>
      <CardHeader>
        <h1>{ru.child.gifts.title}</h1>
        <CardDescription className="mt-1 max-w-prose text-base">
          {ru.child.gifts.description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
