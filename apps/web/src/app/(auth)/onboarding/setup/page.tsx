"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";

export default function Setup() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "create" }),
      });
      if (!r.ok) throw Error();
      setCode((await r.json()).code);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);
  useEffect(() => {
    setDomain(window.location.origin);
    void load();
  }, [load]);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel as="h1" title={t.setup.title} note={t.setup.note}>
        <p>{t.setup.code}</p>
        <output
          className="text-center font-heading text-4xl tracking-widest"
          data-testid="setup-code"
        >
          {code}
        </output>
        <p>{t.setup.expires}</p>
        {error && <p role="alert">{t.settings.error}</p>}
        <button type="button" className={outlineButton} onClick={load}>
          {t.setup.retry}
        </button>
      </Panel>
      <Panel title={t.setup.instructions}>
        <ol className="list-decimal space-y-3 pl-5">
          {t.setup.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p>{t.setup.domain}</p>
        <code className="break-all rounded-xl bg-secondary p-3">{domain}</code>
      </Panel>
      <button
        type="button"
        className={primaryButton}
        onClick={async () => {
          const r = await fetch("/api/parent", { method: "DELETE" });
          if (r.ok) window.location.assign("/entry");
          else setError(true);
        }}
      >
        {t.setup.child}
      </button>
      <Link href="/analytics" className={outlineButton}>
        {t.setup.parent}
      </Link>
    </div>
  );
}
