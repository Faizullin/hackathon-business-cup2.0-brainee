/**
 * How port messages travel. `portTransport` wraps the private `MessagePort`
 * the handshake hands out; `createInProcessPair` connects a host and a game
 * that share one document (`/phaser`), replacing `EventBus` for host ↔ game
 * traffic with the same bridge API.
 */

import type { PortMessage } from "./protocol";

export interface Transport {
  send(message: PortMessage, transfer?: Transferable[]): void;
  /** Raw incoming data; the bridge validates it. Returns an unsubscribe. */
  listen(handler: (data: unknown) => void): () => void;
  close(): void;
}

export function portTransport(port: MessagePort): Transport {
  const handlers = new Set<(data: unknown) => void>();
  const onMessage = (event: MessageEvent) => {
    for (const handler of handlers) handler(event.data);
  };
  port.addEventListener("message", onMessage);
  port.start();

  return {
    send(message, transfer = []) {
      port.postMessage(message, transfer);
    },
    listen(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close() {
      handlers.clear();
      port.removeEventListener("message", onMessage);
      port.close();
    },
  };
}

interface InProcessEnd {
  handlers: Set<(data: unknown) => void>;
  /** Messages that arrived before anyone listened, like a port's queue. */
  queue: unknown[];
}

/**
 * Two connected transports in one page. Messages are structured-cloned and
 * delivered asynchronously, so behaviour matches a real `MessagePort`.
 */
export function createInProcessPair(): [Transport, Transport] {
  const ends: [InProcessEnd, InProcessEnd] = [
    { handlers: new Set(), queue: [] },
    { handlers: new Set(), queue: [] },
  ];
  let closed = false;

  const deliver = (to: InProcessEnd, data: unknown) => {
    if (closed) return;
    if (to.handlers.size === 0) {
      to.queue.push(data);
      return;
    }
    for (const handler of to.handlers) handler(data);
  };

  const make = (self: InProcessEnd, other: InProcessEnd): Transport => ({
    send(message, transfer = []) {
      if (closed) return;
      const copy = structuredClone(message, { transfer });
      queueMicrotask(() => deliver(other, copy));
    },
    listen(handler) {
      self.handlers.add(handler);
      if (self.queue.length > 0) {
        const queued = self.queue.splice(0);
        queueMicrotask(() =>
          queued.forEach((data) => {
            deliver(self, data);
          }),
        );
      }
      return () => self.handlers.delete(handler);
    },
    close() {
      closed = true;
      for (const end of ends) {
        end.handlers.clear();
        end.queue.length = 0;
      }
    },
  });

  return [make(ends[0], ends[1]), make(ends[1], ends[0])];
}
