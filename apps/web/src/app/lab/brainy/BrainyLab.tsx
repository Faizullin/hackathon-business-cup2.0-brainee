"use client";

import { BRAINY_PRESETS, type BrainyPreset } from "@brainee/brainy";
import {
  ACCESSORIES,
  type AccessoryId,
  type BrainyStats,
  type Equipped,
  equip,
  SLOTS,
  type Slot,
  STAGES,
  stageOf,
  unequip,
} from "@brainee/core";
import { Button } from "@brainee/ui/components/button";
import { useId, useState } from "react";
import { Brainy } from "@/components/Brainy";
import { useI18n } from "@/i18n";

const STAT_KEYS = ["brain", "eyes", "mouth", "arms", "legs", "resp"] as const;
const fieldClass =
  "min-h-12 rounded-xl border border-border bg-card px-3 text-foreground focus-visible:outline-3 focus-visible:outline-ring";

export function BrainyLab() {
  const { t: ru } = useI18n();
  const baseId = useId();
  const [stats, setStats] = useState<BrainyStats>({ ...BRAINY_PRESETS.now });
  const [equipped, setEquipped] = useState<Equipped>({ face: "glasses" });
  const stage = stageOf(stats);
  const t = ru.lab.brainy;

  function setSlot(slot: Slot, value: string) {
    setEquipped((current) =>
      value ? equip(current, value as AccessoryId) : unequip(current, slot),
    );
  }

  return (
    <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px]">
      <section aria-label={t.preview} className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-2">
          {(Object.keys(BRAINY_PRESETS) as BrainyPreset[]).map((preset) => (
            <Button
              key={preset}
              variant="outline"
              onClick={() => setStats({ ...BRAINY_PRESETS[preset] })}
            >
              {t.presets[preset]}
            </Button>
          ))}
        </div>
        <div className="flex w-full flex-wrap items-end justify-center gap-6 rounded-panel border border-border bg-card p-6">
          <Brainy stats={stats} equipped={equipped} className="h-auto w-full max-w-[320px]" />
          {/* Dock size (~136 px) to check legibility when small. */}
          <Brainy stats={stats} equipped={equipped} label="" className="h-[136px] w-auto" />
        </div>
        <div data-testid="brainy-stage" className="w-full max-w-md text-center">
          <p className="font-heading text-lg font-semibold">{ru.stages[stage.id]}</p>
          <p className="text-muted-foreground text-sm">
            {t.average}: {stage.average.toFixed(1)}
            {stage.next ? ` · ${t.toNext(ru.stages[stage.next], stage.pointsToNext)}` : ""}
          </p>
          <ol className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden="true">
            {STAGES.map((s, i) => (
              <li key={s.id} className="h-2 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full bg-mint"
                  style={{
                    width: `${i < stage.index ? 100 : i === stage.index ? Math.round(stage.progress * 100) : 0}%`,
                  }}
                />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className="flex flex-col gap-4 rounded-panel border border-border bg-card p-4">
        <h2 className="font-heading font-semibold">{t.stats}</h2>
        {STAT_KEYS.map((key) => (
          <label
            key={key}
            htmlFor={`${baseId}-${key}`}
            className="flex flex-col gap-1 text-sm font-medium"
          >
            <span className="flex justify-between">
              {t.statNames[key]} <output>{stats[key]}</output>
            </span>
            <input
              id={`${baseId}-${key}`}
              type="range"
              min={0}
              max={100}
              value={stats[key]}
              onChange={(e) => setStats((s) => ({ ...s, [key]: Number(e.target.value) }))}
              className="h-8 accent-(--sky)"
            />
          </label>
        ))}
        <h2 className="font-heading font-semibold">{t.accessories}</h2>
        {SLOTS.map((slot) => (
          <label
            key={slot}
            htmlFor={`${baseId}-${slot}`}
            className="flex flex-col gap-1 text-sm font-medium"
          >
            {t.slots[slot]}
            <select
              id={`${baseId}-${slot}`}
              className={fieldClass}
              value={equipped[slot] ?? ""}
              onChange={(e) => setSlot(slot, e.target.value)}
            >
              <option value="">{t.none}</option>
              {ACCESSORIES.filter((a) => a.slot === slot).map((a) => (
                <option key={a.id} value={a.id}>
                  {ru.accessories[a.id]} · {a.priceStars} ★
                </option>
              ))}
            </select>
          </label>
        ))}
      </aside>
    </div>
  );
}
