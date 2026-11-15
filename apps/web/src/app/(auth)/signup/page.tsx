"use client";
import {
  type FunnelAnswers,
  funnelBirthYears,
  isFunnelAnswers,
  reachable,
  TIME_ZONES,
  toFamilyPlan,
} from "@brainee/core";
import { useEffect, useState } from "react";
import { authCopy } from "@/components/auth/copy";
import { Panel, primaryButton } from "@/components/demo/kit";
import { funnelCopy as c } from "@/components/funnel/copy";
import { loadFunnel } from "@/components/funnel/storage";
import { useI18n } from "@/i18n";
import { requireAuthResponse, useAuthAction } from "@/lib/use-auth-action";

// Hackathon demo: every family uses PIN 1234 unless the parent changes it in Settings.
const DEMO_PIN_HINT = { pin: "1234" } as const;

export default function Signup() {
  const { t } = useI18n();
  const { pending: busy, error, run } = useAuthAction();
  const [funnel, setFunnel] = useState<FunnelAnswers | null>(null);
  useEffect(() => {
    const saved = loadFunnel();
    const plan = toFamilyPlan(saved.draft);
    if (reachable("analyze", saved.draft) === "analyze" && isFunnelAnswers(plan)) setFunnel(plan);
    else window.location.replace(`/start${window.location.search}`);
  }, []);
  const years = funnel ? funnelBirthYears(funnel.age, new Date().getUTCFullYear()) : null;
  const to = t.onboarding;
  const ts = t.settings;
  if (!funnel || !years) return <p>{c.loading}</p>;
  return (
    <Panel as="h1" title={c.signupTitle} note={c.signupNote}>
      <p className="mb-4 text-muted-foreground">{c.range(years.min, years.max)}</p>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          await run(async () => {
            const r = await fetch("/api/onboarding", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                funnel,
                email: f.get("email"),
                password: f.get("password"),
                pin: f.get("pin"),
                childName: f.get("childName"),
                birthYear: Number(f.get("birthYear")),
                timeZone: f.get("timeZone"),
              }),
            });
            requireAuthResponse(r);
            window.location.assign("/onboarding/setup");
          });
        }}
      >
        {(
          [
            ["childName", to.childName, "text"],
            ["birthYear", to.birthYear, "number"],
            ["email", "Email", "email"],
            ["password", to.passwordHint, "password"],
            ["pin", to.pin, "password"],
          ] as const
        ).map(([name, label, type]) => (
          <label key={name} className="flex flex-col gap-1">
            {label}
            <input
              className="min-h-12 rounded-xl border border-border px-3"
              name={name}
              type={type}
              required
              min={name === "birthYear" ? years.min : undefined}
              max={name === "birthYear" ? years.max : undefined}
              minLength={name === "password" ? 6 : undefined}
              maxLength={name === "pin" ? 4 : 100}
              pattern={name === "pin" ? "[0-9]{4}" : undefined}
              defaultValue={name === "pin" ? DEMO_PIN_HINT.pin : undefined}
            />
          </label>
        ))}
        <label>
          {ts.timezone}
          <select
            aria-label={ts.timezone}
            name="timeZone"
            defaultValue="America/New_York"
            className="h-12 w-full rounded-xl border border-border px-3"
          >
            {TIME_ZONES.map((z) => (
              <option key={z} value={z}>
                {ts.zones[z]}
              </option>
            ))}
          </select>
        </label>
        {error && <p role="alert">{authCopy.errors[error]}</p>}
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className={`${primaryButton} sm:col-span-2`}
        >
          {busy ? authCopy.creating : to.create}
        </button>
      </form>
    </Panel>
  );
}
