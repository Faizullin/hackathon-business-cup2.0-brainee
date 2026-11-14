"use client";
import { StarIcon } from "@brainee/ui/components/child-icons";
import { MotionSpan, useReducedMotion } from "@brainee/ui/lib/motion";
import { type RefObject, useEffect, useState } from "react";

export function RewardFlight({
  from,
  to,
}: {
  from: RefObject<HTMLElement | null>;
  to: RefObject<HTMLElement | null>;
}) {
  const reduce = useReducedMotion();
  const [path, setPath] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);
  useEffect(() => {
    if (reduce || !from.current || !to.current) return;
    const a = from.current.getBoundingClientRect(),
      b = to.current.getBoundingClientRect();
    setPath({
      x: a.x + a.width / 2,
      y: a.y + a.height / 2,
      dx: b.x + b.width / 2 - a.x - a.width / 2,
      dy: b.y + b.height / 2 - a.y - a.height / 2,
    });
  }, [from, to, reduce]);
  if (!path || reduce) return null;
  return (
    <span
      aria-hidden="true"
      data-testid="reward-flight"
      className="pointer-events-none fixed inset-0 z-40"
    >
      {[0, 1, 2].map((i) => (
        <MotionSpan
          key={i}
          className="absolute text-sun"
          style={{ left: path.x - 8, top: path.y - 8 }}
          initial={{ opacity: 0 }}
          animate={{
            x: [0, path.dx / 2 + (i - 1) * 20, path.dx],
            y: [0, -35 - i * 6, path.dy],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 0.55, delay: i * 0.06, ease: "easeOut" }}
          onAnimationComplete={() => {
            if (i === 2) setPath(null);
          }}
        >
          <StarIcon className="size-4" />
        </MotionSpan>
      ))}
    </span>
  );
}
