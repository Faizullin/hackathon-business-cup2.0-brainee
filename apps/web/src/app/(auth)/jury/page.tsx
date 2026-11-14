"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Panel, primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";

export default function JuryPage() {
  const { t } = useI18n();
  const [credentials, setCredentials] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    void fetch("/api/settings").then(async (r) => {
      if (!r.ok || !(await r.json()).jury) {
        window.location.replace("/login");
        return;
      }
      try {
        setCredentials(JSON.parse(sessionStorage.getItem("brainee-jury") ?? "null"));
      } catch {}
    });
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
      <Panel title={t.jury.credentials}>
        {credentials ? (
          <dl>
            {(["email", "password", "pin"] as const).map((k) => (
              <div key={k} className="flex flex-wrap gap-3">
                <dt>{t.jury[k]}</dt>
                <dd className="break-all font-mono" data-testid={`jury-${k}`}>
                  {credentials[k]}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>{t.jury.missing}</p>
        )}
      </Panel>
    </div>
  );
}
