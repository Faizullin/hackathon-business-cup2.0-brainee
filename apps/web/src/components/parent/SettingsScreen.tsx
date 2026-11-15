"use client";
import { TIME_ZONES } from "@brainee/core";
import { Dialog } from "@brainee/ui/components/dialog";
import { ClipboardCheck, Lock, Settings, Tablet } from "@brainee/ui/components/icons";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { authCopy } from "@/components/auth/copy";
import { Brainy } from "@/components/Brainy";
import { useLearning } from "@/components/child/LearningProvider";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { FamilyLoginCard } from "@/components/parent/FamilyLoginCard";
import { useI18n } from "@/i18n";
import { requireAuthResponse, useAuthAction } from "@/lib/use-auth-action";

const input = "min-h-12 w-full rounded-row border border-border bg-surface-2 px-3 text-base";
type Data = {
  jury: boolean;
  child: { name: string; birthYear: number; promise: number };
  timeZone: string;
  email: string;
  devices: { id: string; createdAt: string; current: boolean }[];
};
export function SettingsScreen() {
  const { snapshot, refresh } = useLearning();
  const { t } = useI18n();
  const ts = t.settings;
  const [data, setData] = useState<Data | null>(null);
  const [notice, setNotice] = useState("");
  const action = useAuthAction();
  const busy = action.pending;
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const loading = useAuthAction();
  const load = useCallback(
    () =>
      loading.run(async () => {
        const r = await fetch("/api/settings", { cache: "no-store" });
        requireAuthResponse(r);
        setData(await r.json());
      }),
    [loading.run],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const run = (body: unknown, path = "/api/settings") =>
    action.run(async () => {
      setNotice("");
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await r.json();
      if (!r.ok) {
        setNotice(result.error === "wrong-pin" ? ts.wrongPin : ts.error);
        return false;
      }
      if (path === "/api/pairing") setCode(result);
      await refresh();
      await load();
      setNotice(ts.saved);
      return true;
    });
  if (!data || !snapshot)
    return (
      <Panel>
        <p role="status">{loading.error ? authCopy.errors[loading.error] : ts.loading}</p>
        <button
          type="button"
          className={outlineButton}
          disabled={loading.pending}
          aria-busy={loading.pending}
          onClick={load}
        >
          {loading.pending ? authCopy.working : ts.retry}
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
      <h1>{ts.title}</h1>
      <div className="flex items-center gap-4 rounded-panel bg-lavender/30 p-4">
        <Brainy stats={snapshot.progress.stats} className="h-24 w-24" />
        <div>
          <h2 className="font-heading font-semibold text-xl">{snapshot.child.name}</h2>
          <p className="text-muted-foreground">{ts.intro}</p>
        </div>
      </div>
      {(notice || action.error) && (
        <p role="status" className="rounded-xl bg-secondary p-3">
          {action.error ? authCopy.errors[action.error] : notice}
        </p>
      )}
      <div className="grid gap-5 min-[1000px]:grid-cols-2">
        <Panel title={ts.child}>
          <ClipboardCheck
            aria-hidden="true"
            className="size-10 rounded-row bg-violet-wash p-2 text-accent"
          />
          <form
            key={`${data.child.name}-${data.child.birthYear}-${data.child.promise}`}
            onSubmit={submitChild}
            className="flex flex-col gap-3"
          >
            <label>
              {ts.name}
              <input
                className={input}
                name="name"
                required
                maxLength={40}
                defaultValue={data.child.name}
              />
            </label>
            <label>
              {ts.year}
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
              {ts.promise}
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
            <button type="submit" disabled={busy} aria-busy={busy} className={primaryButton}>
              {busy ? authCopy.working : ts.save}
            </button>
          </form>
        </Panel>
        <Panel title={ts.security}>
          <Lock aria-hidden="true" className="size-10 rounded-row bg-violet-wash p-2 text-accent" />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              if (
                await run({
                  type: "pin",
                  oldPin: f.get("oldPin"),
                  newPin: f.get("newPin"),
                })
              )
                form.reset();
            }}
            className="flex flex-col gap-3"
          >
            <label>
              {ts.oldPin}
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
              {ts.newPin}
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
            <button type="submit" disabled={busy} aria-busy={busy} className={primaryButton}>
              {busy ? authCopy.working : ts.changePin}
            </button>
          </form>
        </Panel>
        <Panel title={ts.timezone}>
          <Settings
            aria-hidden="true"
            className="size-10 rounded-row bg-violet-wash p-2 text-accent"
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run({
                type: "timezone",
                timeZone: new FormData(e.currentTarget).get("zone"),
              });
            }}
            className="flex flex-col gap-3"
          >
            <label>
              {ts.timezone}
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
                      {ts.zones[zone]} · {offset}
                    </option>
                  );
                })}
              </select>
            </label>
            <p className="text-muted-foreground text-sm">{ts.zoneNote}</p>
            <button type="submit" disabled={busy} aria-busy={busy} className={primaryButton}>
              {busy ? authCopy.working : ts.save}
            </button>
          </form>
        </Panel>
        <Panel title={ts.devices}>
          <Tablet
            aria-hidden="true"
            className="size-10 rounded-row bg-violet-wash p-2 text-accent"
          />
          <p className="text-muted-foreground text-sm">{ts.pairingNote}</p>
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            className={outlineButton}
            onClick={() => run({ type: "create" }, "/api/pairing")}
          >
            {busy ? authCopy.working : ts.newCode}
          </button>
          {code && (
            <output
              aria-label={ts.code}
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
                  {d.current ? ts.thisDevice : ts.device}
                  <small className="block text-muted-foreground">{t.date(d.createdAt)}</small>
                </span>
                <button
                  type="button"
                  disabled={busy}
                  aria-busy={busy}
                  className={outlineButton}
                  onClick={async () => {
                    if ((await run({ type: "revoke", deviceId: d.id })) && d.current)
                      window.location.assign("/login");
                  }}
                >
                  {busy ? authCopy.working : ts.revoke}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
        <FamilyLoginCard email={data.email} />
        <Panel title={ts.account}>
          {data.jury && (
            <button
              type="button"
              className={outlineButton}
              disabled={busy}
              aria-busy={busy}
              onClick={() =>
                action.run(async () => {
                  setNotice("");
                  requireAuthResponse(await fetch("/api/demo-reset", { method: "POST" }));
                  await refresh();
                  setNotice(ts.saved);
                })
              }
            >
              {busy ? authCopy.working : t.jury.reset}
            </button>
          )}
          <p className="break-all">{data.email}</p>
          <div className="rounded-xl bg-mint/15 p-4">
            <h3 className="font-semibold">{ts.plan}</h3>
            <p className="text-sm">{ts.planNote}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            className={outlineButton}
            onClick={() => setConfirmLogout(true)}
          >
            {busy ? authCopy.working : ts.logout}
          </button>
          <Dialog.Root open={confirmLogout} onOpenChange={setConfirmLogout}>
            <Dialog.Portal>
              <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/30" />
              <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-auto rounded-panel bg-card p-5">
                <Dialog.Title className="font-heading text-xl">{authCopy.logoutTitle}</Dialog.Title>
                <Dialog.Description>{authCopy.logoutNote}</Dialog.Description>
                <FamilyLoginCard email={data.email} />
                {action.error && <p role="alert">{authCopy.errors[action.error]}</p>}
                <button
                  type="button"
                  disabled={busy}
                  aria-busy={busy}
                  className={primaryButton}
                  onClick={() =>
                    action.run(async () => {
                      requireAuthResponse(await fetch("/api/auth/logout", { method: "POST" }));
                      window.location.assign("/login");
                    })
                  }
                >
                  {busy ? authCopy.working : authCopy.confirmLogout}
                </button>
                <Dialog.Close className={outlineButton} disabled={busy}>
                  {authCopy.cancel}
                </Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </Panel>
      </div>
    </>
  );
}
