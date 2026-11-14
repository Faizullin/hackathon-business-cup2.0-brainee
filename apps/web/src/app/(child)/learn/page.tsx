import type { Metadata } from "next";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.learn.title };

export default function LearnPage() {
  return (
    <section className="rounded-panel border border-line bg-surface p-5 sm:p-8">
      <h1>{ru.learn.title}</h1>
      <p className="mt-3 max-w-prose text-muted">{ru.learn.description}</p>
    </section>
  );
}
