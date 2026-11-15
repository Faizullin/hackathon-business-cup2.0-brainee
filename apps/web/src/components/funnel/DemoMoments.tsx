"use client";
import { Brainy } from "@brainee/brainy";
import { FUNNEL_SHAPES, isFunnelMatch, STAGES, stagePreviewStats } from "@brainee/core";
import { useState } from "react";
import { outlineButton } from "@/components/demo/kit";
import { demoCopy as c } from "./demo-copy";
export function Shape({
  shape,
  className = "size-14",
}: {
  shape: (typeof FUNNEL_SHAPES)[number];
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className} fill="var(--game-selected)">
      {shape === "circle" ? (
        <circle cx="50" cy="50" r="35" />
      ) : shape === "diamond" ? (
        <path d="M50 10 90 50 50 90 10 50Z" />
      ) : (
        <path d="M50 10 93 88H7Z" />
      )}
    </svg>
  );
}
export function MatchTarget() {
  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <Shape shape="diamond" className="size-24 lg:size-48" />
      <span className="font-bold">{c.target}</span>
    </div>
  );
}
export function MatchDemo() {
  const [selected, setSelected] = useState("");
  const correct = isFunnelMatch(selected);
  return (
    <section aria-label={c.prompt} className="space-y-4" data-testid="funnel-match">
      <div className="grid grid-cols-3 gap-2">
        {FUNNEL_SHAPES.map((shape) => (
          <button
            type="button"
            key={shape}
            aria-pressed={selected === shape}
            disabled={correct}
            onClick={() => setSelected(shape)}
            className={`lv-press flex min-h-28 flex-col items-center justify-center gap-2 rounded-panel p-3 ring-2 ${selected === shape ? (correct ? "bg-[var(--game-correct-wash)] ring-[var(--game-correct)]" : "bg-[var(--game-retry-wash)] ring-[var(--game-retry)]") : "bg-[var(--game-tile)] ring-[var(--game-tile-ring)]"}`}
          >
            <Shape shape={shape} />
            <span className="text-sm font-bold">{c[shape]}</span>
          </button>
        ))}
      </div>
      <p role="status" className="min-h-6 font-semibold">
        {selected ? (correct ? c.finished : c.retry) : c.prompt}
      </p>
      {!correct && (
        <button type="button" className={outlineButton} onClick={() => setSelected("diamond")}>
          {c.reveal}
        </button>
      )}
      <p className="text-sm text-muted-foreground">{c.note}</p>
    </section>
  );
}
export function GrowthDemo() {
  const [index, setIndex] = useState(0);
  const stage = STAGES[index] ?? STAGES[0];
  return (
    <div
      data-testid="funnel-growth"
      data-stage={stage.id}
      className="flex w-full flex-col items-center gap-4 p-4"
    >
      <Brainy
        stats={stagePreviewStats(stage.id)}
        mood={92}
        animate
        label={c.stages[index]}
        className="w-40 lg:w-64"
      />
      <label className="flex w-full flex-col gap-3 font-semibold">
        {c.growth}
        <input
          type="range"
          min={0}
          max={STAGES.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-valuetext={c.stages[index]}
          className="h-11 w-full accent-primary"
        />
      </label>
      <output className="font-heading text-xl">{c.stages[index]}</output>
      <p className="text-center text-sm text-muted-foreground">{c.preview}</p>
    </div>
  );
}
