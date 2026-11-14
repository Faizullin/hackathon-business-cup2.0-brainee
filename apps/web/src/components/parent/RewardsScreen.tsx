"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useLearning } from "@/components/child/LearningProvider";
import {
  Chip,
  Meter,
  Notice,
  outlineButton,
  Panel,
  primaryButton,
  useAct,
} from "@/components/demo/kit";
import { useI18n } from "@/i18n";

const input = "min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base";

// T-46 for the demo: rules, weekly goal, gift shop CRUD, child requests → "Delivered".
export function RewardsScreen() {
  const { snapshot } = useLearning();
  const { run, busy, notice } = useAct();
  const { t: i18n } = useI18n();
  const t = i18n.parent.rewards;
  const [target, setTarget] = useState(10);
  const [giftId, setGiftId] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(3);
  const goal = snapshot?.showcase.weekGoal;
  const savedTarget = goal?.target;
  const savedGift = goal?.giftId;
  useEffect(() => {
    if (savedTarget !== undefined) setTarget(savedTarget);
    if (savedGift !== undefined) setGiftId(savedGift);
  }, [savedTarget, savedGift]);
  if (!snapshot || !goal) return null;
  const { gifts, requests } = snapshot.showcase;
  const addGift = async (event: FormEvent) => {
    event.preventDefault();
    if (await run({ type: "gift-add", title, price })) setTitle("");
  };
  return (
    <>
      <h1>{t.title}</h1>
      <p className="rounded-panel bg-sun/15 p-4 font-semibold">{t.rules}</p>
      <Notice notice={notice} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t.goal}>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>
              {goal.earned} / {goal.target} ☀
            </span>
            <span className="text-muted-foreground">{i18n.child.gifts.goalDue(goal.due)}</span>
          </div>
          <Meter value={(goal.earned / goal.target) * 100} tone="bg-sun" />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t.target}
              <input
                type="number"
                min={1}
                max={100}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t.prize}
              <select value={giftId} onChange={(e) => setGiftId(e.target.value)} className={input}>
                {gifts.map((gift) => (
                  <option key={gift.id} value={gift.id}>
                    {gift.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={busy}
            className={primaryButton}
            onClick={() => run({ type: "goal-set", target, giftId }, t.save)}
          >
            {t.save}
          </button>
        </Panel>
        <Panel title={t.requests}>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">{t.noRequests}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {requests.map((request) => (
                <li
                  key={request.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <span className="flex-1">
                    <span className="block font-semibold">{request.title}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(request.at).toLocaleString("ru-RU", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </span>
                  {request.delivered ? (
                    <Chip tone="mint">{t.delivered}</Chip>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      className={primaryButton}
                      onClick={() => run({ type: "gift-deliver", requestId: request.id })}
                    >
                      {t.deliver}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <Panel title={t.shop}>
        <ul className="flex flex-col gap-2">
          {gifts.map((gift) => (
            <li
              key={gift.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <span className="flex-1 font-semibold">
                {gift.title}{" "}
                <span className="font-normal text-muted-foreground">· {gift.price} ☀</span>
              </span>
              {gift.id === goal.giftId && <Chip tone="sun">{i18n.child.gifts.goalMark}</Chip>}
              <button
                type="button"
                disabled={busy || gift.id === goal.giftId}
                className={outlineButton}
                onClick={() => run({ type: "gift-remove", giftId: gift.id })}
              >
                {t.remove}
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addGift} className="grid grid-cols-[1fr_6rem_auto] items-end gap-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t.giftTitle}
            <input
              required
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t.giftPrice}
            <input
              type="number"
              min={1}
              max={100}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className={input}
            />
          </label>
          <button type="submit" disabled={busy} className={primaryButton}>
            {t.add}
          </button>
        </form>
      </Panel>
    </>
  );
}
