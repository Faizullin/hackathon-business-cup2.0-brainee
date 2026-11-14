import { Card, CardDescription, CardHeader } from "@brainee/ui/components/card";
import type { Metadata } from "next";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.child.leisure.title };

// Stub until T-36 (shop, cartoons, science videos).
export default function LeisurePage() {
  return (
    <Card>
      <CardHeader>
        <h1>{ru.child.leisure.title}</h1>
        <CardDescription className="mt-1 max-w-prose text-base">
          {ru.child.leisure.description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
