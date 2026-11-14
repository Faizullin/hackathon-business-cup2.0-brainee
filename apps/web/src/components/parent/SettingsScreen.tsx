"use client";
import { Brainy } from "@brainee/brainy";
import { TIME_ZONES } from "@brainee/core";
import { ClipboardCheck, Lock, Settings, Tablet } from "@brainee/ui/components/icons";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useLearning } from "@/components/child/LearningProvider";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { ru } from "@/i18n/ru";

const t = ru.settings;
const input = "min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base";
type Data = {
  jury: boolean;
  child: { name: string; birthYear: number; promise: number };
  timeZone: string;
  email: string;
  devices: { id: string; createdAt: string; current: boolean }[];
};
export function SettingsScreen() {
  const { snapshot, refresh } = useLearning();
  const [data, setData] = useState<Data | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/settings", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setNotice(t.error);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const run = async (body: unknown, path = "/api/settings") => {
    setBusy(true);
    setNotice("");
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await r.json();
      if (!r.ok) {
        setNotice(result.error === "wrong-pin" ? t.wrongPin : t.error);
        return false;
      }
      if (path === "/api/pairing") setCode(result);
      await refresh();
      await load();
      setNotice(t.saved);
      return true;
    } catch {
      setNotice(t.error);
      return false;
    } finally {
      setBusy(false);
    }
  };
  if (!data || !snapshot)
    return (
      <Panel>
        <p role="status">{notice || t.loading}</p>
        <button type="button" className={outlineButton} onClick={load}>
          {t.retry}
        </button>
      </Panel>
    );
  const submitChild = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void run({
      type: "child",
      child: {
        name: f.get("name"),
        birthYear: Number(f.get("year")),
        promise: Number(f.get("promise")),
      },
    });
  };
  return (
    <>
      <h1>{t.title}</h1>
      <div className="flex items-center gap-4 rounded-panel bg-lavender/30 p-4">
        <Brainy stats={snapshot.progress.stats} className="h-24 w-24" />
        <div>
          <h2 className="font-heading text-xl font-semibold">{snapshot.child.name}</h2>
          <p className="text-muted-foreground">{t.intro}</p>
        </div>
      </div>
      {notice && (
        <p role="status" className="rounded-xl bg-secondary p-3">
          {notice}
        </p>
      )}
      <div className="grid gap-5 min-[1000px]:grid-cols-2">
        <Panel title={t.child}>
          <ClipboardCheck aria-hidden="true" className="size-6 text-coral" />
          <form
            key={`${data.child.name}-${data.child.birthYear}-${data.child.promise}`}
            onSubmit={submitChild}
            className="flex flex-col gap-3"
          >
            <label>
              {t.name}
              <input
                className={input}
                name="name"
                required
                maxLength={40}
                defaultValue={data.child.name}
              />
            </label>
            <label>
              {t.year}
              <input
                className={input}
                name="year"
                type="number"
                required
                min={new Date().getUTCFullYear() - 10}
                max={new Date().getUTCFullYear() - 4}
                defaultValue={data.child.birthYear}
              />
            </label>
            <label>
              {t.promise}
              <input
                className={input}
                name="promise"
                type="number"
                min={1}
                max={5}
                required
                defaultValue={data.child.promise}
              />
            </label>
            <button type="submit" disabled={busy} className={primaryButton}>
              {t.save}
            </button>
          </form>
        </Panel>
        <Panel title={t.security}>
          <Lock aria-hidden="true" className="size-6 text-coral" />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              if (await run({ type: "pin", oldPin: f.get("oldPin"), newPin: f.get("newPin") }))
                form.reset();
            }}
            className="flex flex-col gap-3"
          >
            <label>
              {t.oldPin}
              <input
                className={input}
                name="oldPin"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
              />
            </label>
            <label>
              {t.newPin}
              <input
                className={input}
                name="newPin"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                required
              />
            </label>
            <button type="submit" disabled={busy} className={primaryButton}>
              {t.changePin}
            </button>
          </form>
        </Panel>
        <Panel title={t.timezone}>
          <Settings aria-hidden="true" className="size-6 text-coral" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run({ type: "timezone", timeZone: new FormData(e.currentTarget).get("zone") });
            }}
            className="flex flex-col gap-3"
          >
            <label>
              {t.timezone}
              <select
                key={data.timeZone}
                name="zone"
                defaultValue={data.timeZone}
                className={`${input} h-12 appearance-none`}
              >
                {TIME_ZONES.map((zone) => {
                  const offset = new Intl.DateTimeFormat("en", {
                    timeZone: zone,
                    timeZoneName: "shortOffset",
                  })
                    .formatToParts(new Date())
                    .find((p) => p.type === "timeZoneName")
                    ?.value.replace("GMT", "UTC");
                  return (
                    <option key={zone} value={zone}>
                      {t.zones[zone]} · {offset}
                    </option>
                  );
                })}
              </select>
            </label>
            <p className="text-sm text-muted-foreground">{t.zoneNote}</p>
            <button type="submit" disabled={busy} className={primaryButton}>
              {t.save}
            </button>
          </form>
        </Panel>
        <Panel title={t.devices}>
          <Tablet aria-hidden="true" className="size-6 text-coral" />
          <p className="text-muted-foreground text-sm">{t.pairingNote}</p>
          <button
            type="button"
            disabled={busy}
            className={outlineButton}
            onClick={() => run({ type: "create" }, "/api/pairing")}
          >
            {t.newCode}
          </button>
          {code && (
            <output
              aria-label={t.code}
              data-testid="pairing-code"
              className="rounded-xl bg-sky/20 p-4 text-center font-heading text-3xl tracking-widest"
            >
              {code.code}
            </output>
          )}
          <ul className="flex flex-col gap-2">
            {data.devices.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"
              >
                <span>
                  {d.current ? t.thisDevice : t.device}
                  <small className="block text-muted-foreground">{ru.date(d.createdAt)}</small>
                </span>
                <button
                  type="button"
                  disabled={busy}
                  className={outlineButton}
                  onClick={async () => {
                    if ((await run({ type: "revoke", deviceId: d.id })) && d.current)
                      window.location.assign("/login");
                  }}
                >
                  {t.revoke}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t.account}>
          {data.jury && (
            <button
              type="button"
              className={outlineButton}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await fetch("/api/demo-reset", { method: "POST" });
                  if (!r.ok) throw Error();
                  await refresh();
                  setNotice(t.saved);
                } catch {
                  setNotice(t.error);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {ru.jury.reset}
            </button>
          )}
          <p className="break-all">{data.email}</p>
          <div className="rounded-xl bg-mint/15 p-4">
            <h3 className="font-semibold">{t.plan}</h3>
            <p className="text-sm">{t.planNote}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            className={outlineButton}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await fetch("/api/auth/logout", { method: "POST" });
                if (!r.ok) throw new Error();
                window.location.assign("/login");
              } catch {
                setNotice(t.error);
                setBusy(false);
              }
            }}
          >
            {t.logout}
          </button>
        </Panel>
      </div>
    </>
  );
}
