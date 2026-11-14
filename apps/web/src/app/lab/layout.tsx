import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { ru } from "@/i18n/ru";
import { isLabEnabled } from "./enabled";
import { LabNav } from "./LabNav";

export const metadata: Metadata = { title: ru.lab.title, robots: { index: false } };

export default async function LabLayout({ children }: { children: ReactNode }) {
  await connection(); // read the env at request time, not at build time
  if (!isLabEnabled()) notFound();
  return (
    <main
      id="main-content"
      className="mx-auto min-h-dvh w-full max-w-[1180px] px-[max(16px,env(safe-area-inset-left))] py-5"
    >
      <h1>{ru.lab.title}</h1>
      <p className="mt-1 text-muted-foreground">{ru.lab.description}</p>
      <LabNav />
      {children}
    </main>
  );
}
