"use client";
import { HeroCapeArt } from "@brainee/brainy";
import { STARTER_STARS, type StateSnapshot } from "@brainee/core";
import { useEffect, useRef, useState } from "react";
import { Brainy } from "@/components/Brainy";
import "./starter-unlock.css";

const copy = {
  label: "Starter Pack unlocked",
  title: "Starter Pack unlocked",
  badge: "Exclusive",
  sub: "A Hero Cape that is never in the shop",
  gain: `+${STARTER_STARS} ★`,
  go: "Let’s play",
};
const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function GiftBox() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <rect
        x="10"
        y="42"
        width="100"
        height="62"
        rx="8"
        fill="#5A3FE0"
        stroke="#1C1B33"
        strokeWidth="3"
      />
      <rect x="52" y="42" width="16" height="62" fill="#FF9EC2" />
      <g className="su-lid">
        <rect
          x="4"
          y="22"
          width="112"
          height="24"
          rx="8"
          fill="#8C76FF"
          stroke="#1C1B33"
          strokeWidth="3"
        />
        <rect x="52" y="22" width="16" height="24" fill="#FF9EC2" />
        <path
          d="M60 22C44 2 28 8 38 18c6 6 22 4 22 4Zm0 0c16-20 32-14 22-4-6 6-22 4-22 4Z"
          fill="#FF9EC2"
          stroke="#1C1B33"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * One-time full-screen moment on the first visit after the funnel (D-41). The flag lives on the
 * family (`showcase.starterPack`), so it is shown once and survives reloads until "Let's play".
 */
export function StarterUnlock({
  snapshot,
  onSeen,
}: {
  snapshot: StateSnapshot;
  onSeen: () => void;
}) {
  const [open, setOpen] = useState(true);
  const stars = snapshot.progress.wallet.stars;
  const base = Math.max(0, stars - STARTER_STARS);
  const [shown, setShown] = useState(reduced() ? stars : base);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (reduced()) {
      button.current?.focus();
      return;
    }
    const start = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 900);
        setShown(Math.round(base + (stars - base) * p));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, 2800);
    let frame = 0;
    const focus = setTimeout(() => button.current?.focus(), 3500);
    return () => {
      clearTimeout(start);
      clearTimeout(focus);
      cancelAnimationFrame(frame);
    };
  }, [base, stars]);
  if (!open) return null;
  const { equipped } = snapshot.showcase;
  const { back: _cape, ...bare } = equipped;
  const props = {
    stats: snapshot.progress.stats,
    mood: snapshot.progress.mood,
    earned: snapshot.showcase.earned,
    label: "",
    animate: true,
  };
  return (
    <div
      className="su-stage"
      role="dialog"
      aria-modal="true"
      aria-label={copy.label}
      data-testid="starter-unlock"
    >
      <div className="su-inner">
        <div className="su-hero">
          <div className="su-brainy su-before">
            <Brainy {...props} equipped={bare} />
          </div>
          <div className="su-brainy su-after" data-testid="starter-unlock-brainy">
            <Brainy {...props} equipped={equipped} />
          </div>
          <div className="su-burst" />
          <div className="su-fly">
            <HeroCapeArt />
          </div>
          <div className="su-box">
            <GiftBox />
          </div>
          <div className="su-shine">
            <i className="su-spark" />
            <i className="su-spark" />
            <i className="su-spark" />
            <i className="su-spark" />
            <i className="su-spark" />
          </div>
        </div>
        <span className="su-badge" data-testid="starter-badge">
          ★ {copy.badge}
        </span>
        <h2 className="su-title">{copy.title}</h2>
        <p className="su-sub">{copy.sub}</p>
        <div className="su-wallet">
          <span className="su-gain" data-testid="starter-gain">
            {copy.gain}
          </span>
          <span className="su-bank" data-testid="starter-bank" aria-live="polite">
            ★ {shown}
          </span>
        </div>
        <button
          ref={button}
          type="button"
          className="su-go"
          data-testid="starter-go"
          onClick={() => {
            setOpen(false);
            onSeen();
          }}
        >
          {copy.go}
        </button>
      </div>
    </div>
  );
}
