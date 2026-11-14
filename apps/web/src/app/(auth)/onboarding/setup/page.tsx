"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { ru } from "@/i18n/ru";
export default function Setup() {
  const [code, setCode] = useState(""),
    [domain, setDomain] = useState(""),
    [error, setError] = useState(false);
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
      <Panel as="h1" title={ru.setup.title} note={ru.setup.note}>
        <p>{ru.setup.code}</p>
        <output
          className="text-center font-heading text-4xl tracking-widest"
          data-testid="setup-code"
        >
          {code}
        </output>
        <p>{ru.setup.expires}</p>
        {error && <p role="alert">{ru.settings.error}</p>}
        <button type="button" className={outlineButton} onClick={load}>
          {ru.setup.retry}
        </button>
      </Panel>
      <Panel title={ru.setup.instructions}>
        <ol className="list-decimal space-y-3 pl-5">
          {ru.setup.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p>{ru.setup.domain}</p>
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
        {ru.setup.child}
      </button>
      <Link href="/analytics" className={outlineButton}>
        {ru.setup.parent}
      </Link>
    </div>
  );
}
