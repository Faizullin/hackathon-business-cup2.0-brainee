import type { Metadata } from "next";
import Link from "next/link";
import { ru } from "@/i18n/ru";

export const metadata: Metadata = { title: ru.login.title };

export default function LoginPage() {
  return (
    <section className="rounded-panel border border-line bg-surface p-5 sm:p-8">
      <h1>{ru.login.title}</h1>
      <p className="mt-3 text-muted">{ru.login.description}</p>
      <Link
        href="/learn"
        className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-ink px-4 py-3 font-semibold text-surface"
      >
        {ru.app.toLearn}
      </Link>
    </section>
  );
}
