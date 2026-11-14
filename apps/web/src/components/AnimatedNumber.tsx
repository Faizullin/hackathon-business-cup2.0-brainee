"use client";
import { animate, useReducedMotion } from "@brainee/ui/lib/motion";
import { useEffect, useRef, useState } from "react";

/** Only the presentation interpolates; the supplied value is always server-confirmed. */
export function AnimatedNumber({
  value,
  from = value,
  format = String,
}: {
  value: number;
  from?: number;
  format?: (value: number) => string;
}) {
  const reduce = useReducedMotion();
  const previous = useRef(from);
  const [shown, setShown] = useState(from);
  useEffect(() => {
    const start = previous.current;
    previous.current = value;
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(start, value, {
      duration: 0.45,
      ease: "easeOut",
      onUpdate: (n) => setShown(Math.round(n)),
    });
    return () => controls.stop();
  }, [value, reduce]);
  return <span aria-live="off">{format(reduce ? value : shown)}</span>;
}
