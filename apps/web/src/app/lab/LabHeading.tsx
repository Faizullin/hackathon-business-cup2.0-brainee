"use client";
import { useI18n } from "@/i18n";
export function LabHeading() {
  const { t } = useI18n();
  return (
    <>
      <h1>{t.lab.title}</h1>
      <p className="mt-1 text-muted-foreground">{t.lab.description}</p>
    </>
  );
}
