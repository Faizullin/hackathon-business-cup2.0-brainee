import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ru } from "@/i18n/ru";
import { LabClient } from "./LabClient";

export const metadata: Metadata = { title: ru.lab.title, robots: { index: false } };

// Dev-only tool: on in `next dev`, off in production unless BRAINEE_LAB=1 (e2e sets it).
export function isLabEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "production" || env.BRAINEE_LAB === "1";
}

export default async function LabPage() {
  await connection(); // read the env at request time, not at build time
  if (!isLabEnabled()) notFound();
  return (
    <main
      id="main-content"
      className="mx-auto min-h-dvh w-full max-w-[1180px] px-[max(16px,env(safe-area-inset-left))] py-5"
    >
      <h1>{ru.lab.title}</h1>
      <p className="mt-1 text-muted-foreground">{ru.lab.description}</p>
      <LabClient />
    </main>
  );
}
