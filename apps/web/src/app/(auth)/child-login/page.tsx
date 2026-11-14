"use client";
import Link from "next/link";
import { useState } from "react";
import { Panel, primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";

export default function ChildLogin() {
  const { t } = useI18n();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tp = t.pairing;
  return (
    <div className="mx-auto max-w-md">
      <Panel title={tp.title} as="h1">
        <p>{tp.note}</p>
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
              setError(r.status === 429 ? tp.locked : tp.wrong);
            } catch {
              setError(t.settings.error);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            {tp.code}
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
            {tp.submit}
          </button>
        </form>
        <Link href="/login">{tp.parent}</Link>
      </Panel>
    </div>
  );
}
