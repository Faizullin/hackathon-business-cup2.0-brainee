"use client";

import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import type { FormEvent } from "react";
import { authCopy } from "@/components/auth/copy";
import { primaryButton } from "@/components/demo/kit";
import { JuryButton } from "@/components/JuryButton";
import { useI18n } from "@/i18n";
import { requireAuthResponse, useAuthAction } from "@/lib/use-auth-action";

const input = "min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base";

// D-24: own minimal parent login; the device then opens the family's child with parent pages unlocked.
export function ParentLogin() {
  const { t } = useI18n();
  const tl = t.login;
  const { pending: busy, error, run } = useAuthAction();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      requireAuthResponse(response);
      window.location.assign("/analytics");
    });
  };
  return (
    <>
      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded-panel border border-border bg-card p-5"
      >
        <h2 className="font-heading font-semibold text-lg">{tl.parentLogin}</h2>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {tl.email}
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="flex flex-col gap-1 font-medium text-sm">
          {tl.password}
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={input}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-loss-wash p-3 text-sm">
            {error === "wrong" ? tl.wrong : authCopy.errors[error]}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className={cn(primaryButton, "min-h-12")}
        >
          {busy ? authCopy.signingIn : tl.submit}
        </button>
        <Link
          href="/start"
          className="font-semibold text-accent text-sm underline-offset-4 hover:underline"
        >
          {tl.newFamily}
        </Link>

        <Link href="/child-login" className="font-semibold text-accent">
          {t.pairing.child}
        </Link>
      </form>
      <JuryButton />
    </>
  );
}
