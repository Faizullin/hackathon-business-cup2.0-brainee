"use client";
import { useReducedMotion } from "@brainee/ui/lib/reduced-motion";
import { useEffect, useRef, useState } from "react";
import { primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";

export function HoldToStart({ onStart }: { onStart(): void }) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const begin = () => {
    if (reduced || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onStart();
    }, 700);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <button
      type="button"
      className={`${primaryButton} relative min-h-14 w-full overflow-hidden touch-none`}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onBlur={cancel}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          if (reduced) onStart();
          else begin();
        }
      }}
      onKeyUp={cancel}
      onClick={(e) => {
        if (reduced || e.detail === 0) onStart();
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-white/20"
        style={{
          width: holding ? "100%" : "0%",
          transition: holding ? "width 700ms linear" : "none",
        }}
      />
      <span className="relative">{reduced ? t.onboarding.tap : t.onboarding.hold}</span>
    </button>
  );
}
