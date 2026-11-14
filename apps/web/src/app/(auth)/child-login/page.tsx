"use client";
import Link from "next/link";
import { useState } from "react";
import { Panel, primaryButton } from "@/components/demo/kit";
import { ru } from "@/i18n/ru";
export default function ChildLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = ru.pairing;
  return (
    <div className="mx-auto max-w-md">
      <Panel title={t.title} as="h1">
        <p>{t.note}</p>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const code = new FormData(e.currentTarget).get("code");
            setBusy(true);
            setError("");
            try {
              const r = await fetch("/api/pairing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
              });
              if (r.ok) {
                window.location.assign("/entry");
                return;
              }
              setError(r.status === 429 ? t.locked : t.wrong);
            } catch {
              setError(ru.settings.error);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {t.code}
            <input
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              className="min-h-14 w-full rounded-xl border border-border px-4 text-center text-2xl tracking-widest"
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={busy} className={primaryButton}>
            {t.submit}
          </button>
        </form>
        <Link href="/login">{t.parent}</Link>
      </Panel>
    </div>
  );
}
