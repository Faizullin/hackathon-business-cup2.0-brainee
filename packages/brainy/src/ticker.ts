/** One shared, demand-driven clock. The hook subscribes only visible, motion-enabled heroes. */
export function createTicker(
  request: (fn: (now: number) => void) => number,
  cancel: (id: number) => void,
) {
  const listeners = new Set<() => void>();
  let frame: number | undefined;
  let previous: number | undefined;
  let time = 0;
  function tick(now: number) {
    if (previous === undefined) previous = now;
    if (now - previous >= 1000 / 30) {
      time += Math.min(100, now - previous) / 1000;
      previous = now;
      for (const listener of listeners) listener();
    }
    if (listeners.size) frame = request(tick);
  }
  return {
    getSnapshot: () => time,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (frame === undefined) frame = request(tick);
      return () => {
        listeners.delete(listener);
        if (!listeners.size && frame !== undefined) {
          cancel(frame);
          frame = undefined;
          previous = undefined;
        }
      };
    },
  };
}
