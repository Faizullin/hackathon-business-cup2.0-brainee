"use client";
import { authCopy } from "@/components/auth/copy";
import { outlineButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { enterJury } from "@/lib/jury";
import { useAuthAction } from "@/lib/use-auth-action";

export function JuryButton() {
  const { t } = useI18n();
  const { pending: busy, error, run } = useAuthAction();
  return (
    <div>
      <button
        type="button"
        className={`${outlineButton} min-h-14 w-full`}
        disabled={busy}
        aria-busy={busy}
        onClick={() => run(enterJury)}
      >
        {busy ? authCopy.creating : t.jury.join}
      </button>
      {error && <p role="alert">{t.jury.error}</p>}
    </div>
  );
}
