"use client";
import { TIME_ZONES } from "@brainee/core";
import { useState } from "react";
import { Panel, primaryButton } from "@/components/demo/kit";
import { ru } from "@/i18n/ru";
export default function Signup() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const t = ru.onboarding;
  return (
    <Panel as="h1" title={ru.signup.title} note={ru.signup.note}>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          try {
            const r = await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: f.get("email"),
                password: f.get("password"),
                pin: f.get("pin"),
                childName: f.get("childName"),
                birthYear: Number(f.get("birthYear")),
                timeZone: f.get("timeZone"),
              }),
            });
            if (!r.ok) throw Error();
            window.location.assign("/onboarding/setup");
          } catch {
            setError(t.invalid);
            setBusy(false);
          }
        }}
      >
        {(
          [
            ["childName", t.childName, "text"],
            ["birthYear", t.birthYear, "number"],
            ["email", "Email", "email"],
            ["password", t.passwordHint, "password"],
            ["pin", t.pin, "password"],
          ] as const
        ).map(([name, label, type]) => (
          <label key={name} className="flex flex-col gap-1">
            {label}
            <input
              className="min-h-12 rounded-xl border border-border px-3"
              name={name}
              type={type}
              required
              min={name === "birthYear" ? new Date().getFullYear() - 10 : undefined}
              max={name === "birthYear" ? new Date().getFullYear() - 4 : undefined}
              minLength={name === "password" ? 6 : undefined}
              maxLength={name === "pin" ? 4 : 100}
              pattern={name === "pin" ? "[0-9]{4}" : undefined}
            />
          </label>
        ))}
        <label>
          {ru.settings.timezone}
          <select
            aria-label={ru.settings.timezone}
            name="timeZone"
            defaultValue="America/New_York"
            className="h-12 w-full rounded-xl border border-border px-3"
          >
            {TIME_ZONES.map((z) => (
              <option key={z} value={z}>
                {ru.settings.zones[z]}
              </option>
            ))}
          </select>
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy} className={`${primaryButton} sm:col-span-2`}>
          {t.create}
        </button>
      </form>
    </Panel>
  );
}
