"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Panel, primaryButton } from "@/components/demo/kit";
import { FamilyLoginCard } from "@/components/parent/FamilyLoginCard";
import { useI18n } from "@/i18n";

export default function JuryPage() {
  const { t } = useI18n();
  useEffect(() => {
    void fetch("/api/settings")
      .then(async (r) => {
        if (!r.ok || !(await r.json()).jury) {
          window.location.replace("/login");
          return;
        }
      })
      .catch(() => window.location.replace("/login"));
  }, []);
  return (
    <div className="flex flex-col gap-5">
      <Panel as="h1" title={t.jury.title} note={t.jury.note}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/entry" className={`${primaryButton} min-h-24`}>
            {t.jury.child}
          </Link>
          <Link href="/analytics" className={`${primaryButton} min-h-24`}>
            {t.jury.parent}
          </Link>
        </div>
        <ol className="list-decimal space-y-2 pl-5">
          {t.jury.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Panel>
      <FamilyLoginCard prefix="jury" title={t.jury.credentials} />
    </div>
  );
}
