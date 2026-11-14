"use client";
import { useState } from "react";
import { primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";

export function JuryButton() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <div>
      <button
        type="button"
        className={`${primaryButton} min-h-14 w-full`}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(false);
          try {
            const r = await fetch("/api/jury", { method: "POST" });
            if (!r.ok) throw Error();
            const data = await r.json();
            try {
              sessionStorage.setItem(
                "brainee-jury",
                JSON.stringify(data.credentials),
              );
            } catch {}
            window.location.assign("/jury");
          } catch {
            setError(true);
            setBusy(false);
          }
        }}
      >
        {t.jury.join}
      </button>
      {error && <p role="alert">{t.jury.error}</p>}
    </div>
  );
}
