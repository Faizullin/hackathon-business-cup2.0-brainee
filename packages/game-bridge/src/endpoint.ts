/**
 * The half of the protocol both sides share: RPC (ids, timeouts, typed
 * errors) and lossy fast state. `GameBridge` and `HostBridge` each compose one
 * per connection; nothing subclasses it.
 */

import { BridgeError, type BridgeErrorCode, type PortMessage } from "./protocol";
import type { Transport } from "./transport";

export type AnyMethod = (...args: unknown[]) => unknown;

/** Fast state goes out at most this often (≤ 20 Hz); latest value per key wins. */
export const STATE_INTERVAL_MS = 50;
export const DEFAULT_CALL_TIMEOUT_MS = 5000;

export interface EndpointOptions {
  transport: Transport;
  /** A function to run, or the error code to answer with. */
  resolveMethod(name: string): AnyMethod | BridgeErrorCode;
  callTimeoutMs?: number;
}

interface PendingCall {
  resolve(value: unknown): void;
  reject(error: BridgeError): void;
  timer: ReturnType<typeof setTimeout>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class Endpoint {
  private readonly options: EndpointOptions;
  private nextId = 1;
  private readonly pending = new Map<number, PendingCall>();
  private stateQueue: Record<string, unknown> = {};
  private stateTimer: ReturnType<typeof setTimeout> | null = null;
  private lastStateAt = 0;
  private closed = false;

  constructor(options: EndpointOptions) {
    this.options = options;
  }

  send(message: PortMessage, transfer?: Transferable[]) {
    if (this.closed) return;
    this.options.transport.send(message, transfer);
  }

  call(method: string, args: unknown[]): Promise<unknown> {
    if (this.closed) {
      return Promise.reject(new BridgeError("unavailable", "Bridge is closed"));
    }
    const id = this.nextId++;
    const timeoutMs = this.options.callTimeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new BridgeError("timeout", `${method} timed out after ${timeoutMs} ms`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.send({ kind: "call", id, method, args });
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(new BridgeError("failed", errorMessage(error)));
      }
    });
  }

  setState(key: string, value: unknown) {
    if (this.closed) return;
    this.stateQueue[key] = value;
    if (this.stateTimer) return;
    const wait = Math.max(0, STATE_INTERVAL_MS - (Date.now() - this.lastStateAt));
    this.stateTimer = setTimeout(() => this.flushState(), wait);
  }

  flushState() {
    if (this.stateTimer) clearTimeout(this.stateTimer);
    this.stateTimer = null;
    const values = this.stateQueue;
    if (Object.keys(values).length === 0) return;
    this.stateQueue = {};
    this.lastStateAt = Date.now();
    this.send({ kind: "state", values });
  }

  /** Handles `call` and `result`; returns `false` for every other kind. */
  handle(message: PortMessage): boolean {
    if (message.kind === "result") {
      const pending = this.pending.get(message.id);
      if (!pending) return true;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.ok) pending.resolve(message.value);
      else pending.reject(new BridgeError(message.code, message.error));
      return true;
    }
    if (message.kind === "call") {
      void this.answer(message.id, message.method, message.args);
      return true;
    }
    return false;
  }

  private async answer(id: number, method: string, args: unknown[]) {
    const target = this.options.resolveMethod(method);
    if (typeof target === "string") {
      this.fail(id, target, `${method}: ${target}`);
      return;
    }
    let value: unknown;
    try {
      value = await target(...args);
    } catch (error) {
      const code = error instanceof BridgeError ? error.code : "failed";
      this.fail(id, code, errorMessage(error));
      return;
    }
    try {
      const transfer = value instanceof ArrayBuffer ? [value] : undefined;
      this.send({ kind: "result", id, ok: true, value }, transfer);
    } catch (error) {
      // e.g. DataCloneError: the result can't cross the port.
      this.fail(id, "failed", errorMessage(error));
    }
  }

  private fail(id: number, code: BridgeErrorCode, error: string) {
    try {
      this.send({ kind: "result", id, ok: false, code, error });
    } catch {
      // The port is gone; the caller's timeout will fire.
    }
  }

  close() {
    if (this.closed) return;
    this.flushState();
    this.closed = true;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new BridgeError("unavailable", "Bridge closed"));
    }
    this.pending.clear();
    this.options.transport.close();
  }
}
