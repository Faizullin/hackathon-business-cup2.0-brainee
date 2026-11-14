"use client";
import { useState } from "react";
import { primaryButton } from "@/components/demo/kit";
import { ru } from "@/i18n/ru";
export function JuryButton() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
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
              sessionStorage.setItem("brainee-jury", JSON.stringify(data.credentials));
            } catch {}
            window.location.assign("/jury");
          } catch {
            setError(true);
            setBusy(false);
          }
        }}
      >
        {ru.jury.join}
      </button>
      {error && <p role="alert">{ru.jury.error}</p>}
    </div>
  );
}
