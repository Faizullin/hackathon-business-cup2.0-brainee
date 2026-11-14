"use client";
import { type RefObject, useEffect, useState, useSyncExternalStore } from "react";
import { createTicker } from "./ticker";

const ticker = createTicker(
  (fn) => requestAnimationFrame(fn),
  (id) => cancelAnimationFrame(id),
);
const zero = () => 0;
const inactive = () => () => {};
export function useFrame(ref: RefObject<SVGSVGElement | null>, animate: boolean) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!animate || !ref.current) {
      setActive(false);
      return;
    }
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const update = () => setActive(visible && !document.hidden && !media.matches);
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      update();
    });
    observer.observe(ref.current);
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [animate, ref]);
  return useSyncExternalStore(
    active && animate ? ticker.subscribe : inactive,
    active && animate ? ticker.getSnapshot : zero,
    zero,
  );
}
