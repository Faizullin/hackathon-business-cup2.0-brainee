"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { authCopy } from "@/components/auth/copy";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { requireAuthResponse, useAuthAction } from "@/lib/use-auth-action";

export default function Setup() {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState("");
  const { pending, error, run } = useAuthAction();
  const load = useCallback(
    () =>
      run(async () => {
        const r = await fetch("/api/pairing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "create" }),
        });
        requireAuthResponse(r);
        setCode((await r.json()).code);
      }),
    [run],
  );
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
          {pending ? authCopy.code : code}
        </output>
        <p>{t.setup.expires}</p>
        {error && <p role="alert">{authCopy.errors[error]}</p>}
        <button
          type="button"
          className={outlineButton}
          disabled={pending}
          aria-busy={pending}
          onClick={load}
        >
          {pending ? authCopy.code : t.setup.retry}
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
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          run(async () => {
            const r = await fetch("/api/parent", { method: "DELETE" });
            requireAuthResponse(r);
            window.location.assign("/entry");
          })
        }
      >
        {pending ? authCopy.working : t.setup.child}
      </button>
      <Link href="/analytics" className={outlineButton}>
        {t.setup.parent}
      </Link>
    </div>
  );
}
