/**
 * The host side (store page). Answers the game's `hello`, hands that one
 * frame a private `MessagePort`, and validates everything coming back:
 * uploads are untrusted.
 *
 * The React hook (`src/features/game-bridge/use-game-bridge.ts`) wraps this
 * with zod validators, analytics identity and the outbox.
 */

import type {
  GameContract,
  GameMethods,
  HostMethodName,
  HostMethods,
  Implementation,
  MethodArgs,
  MethodResult,
  SchemaLike,
} from "./contract";
import { type AnyMethod, Endpoint } from "./endpoint";
import {
  BRIDGE_PROTOCOL,
  BRIDGE_TAG,
  BridgeError,
  type BridgeErrorCode,
  type GamePhase,
  type HelloMessage,
  isHello,
  type LaunchContext,
  mergeConfig,
  parsePortMessage,
  type WelcomeMessage,
  type WindowLike,
} from "./protocol";
import { portTransport, type Transport } from "./transport";

export const DEFAULT_MAX_MESSAGE_BYTES = 64 * 1024;
export const DEFAULT_MAX_EVENTS_PER_SECOND = 50;
const DEDUPE_WINDOW = 1000;

export type HostBridgeStatus = "waiting" | "connected" | "unbridged" | "closed";

export type DropReason =
  | "rejected"
  | "malformed"
  | "too-large"
  | "unexpected"
  | "rate-limited"
  | "duplicate"
  | "invalid";

/** A game event as the host forwards it (the game's own data only). */
export interface BridgeEvent {
  eventId: string;
  name: string;
  payload: Record<string, unknown>;
  /** The game's clock, ISO 8601. */
  at: string;
  sessionId: string;
  contract: string | null;
}

export interface HostBridgeOptions {
  /** The game frame, e.g. `() => iframeRef.current?.contentWindow`. */
  frame?: () => WindowLike | null | undefined;
  /** Defaults to `window`. */
  self?: WindowLike;
  /** Connect over this instead of the window handshake (`/phaser`). */
  transport?: Transport;
  context: Omit<LaunchContext, "hostMethods">;
  config: unknown;
  methods?: Partial<Implementation<HostMethods>>;
  /** Per-version allowlist; defaults to every implemented method. */
  allowedMethods?: readonly HostMethodName[];
  /** Refuse or adapt to a contract, e.g. an older "puzzle@1". */
  acceptHello?(hello: HelloMessage): boolean;
  /** Returns the payload to forward, or `null` to drop. */
  validateEvent?(name: string, payload: Record<string, unknown>): Record<string, unknown> | null;
  /** Returns the values to forward, or `null` to drop. */
  validateState?(values: Record<string, unknown>): Record<string, unknown> | null;
  onStatus?(status: HostBridgeStatus): void;
  onEvent?(event: BridgeEvent): void;
  onState?(values: Record<string, unknown>): void;
  onLifecycle?(phase: GamePhase, detail?: Record<string, unknown>): void;
  onDrop?(reason: DropReason, data: unknown): void;
  handshakeTimeoutMs?: number;
  callTimeoutMs?: number;
  maxMessageBytes?: number;
  maxEventsPerSecond?: number;
}

const encoder = new TextEncoder();

/** Bound JSON envelopes and binary payloads, including transferred buffers. */
function measureBytes(data: unknown): number {
  try {
    let binaryBytes = 0;
    const text = JSON.stringify(data, (_key, value) => {
      if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
        binaryBytes += value.byteLength;
        return null;
      }
      return value;
    });
    return text === undefined ? 0 : encoder.encode(text).length + binaryBytes;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export class HostBridge<C extends GameContract = GameContract> {
  /** The connected game's contract id, from its `hello`. */
  contract: string | null = null;
  config: unknown;
  readonly stats = {
    events: 0,
    dropped: {} as Partial<Record<DropReason, number>>,
  };

  private readonly options: HostBridgeOptions;
  private currentStatus: HostBridgeStatus = "waiting";
  private endpoint: Endpoint | null = null;
  private nonce: string | null = null;
  private rejectedNonce: string | null = null;
  private pendingState: Record<string, unknown> = {};
  private handshakeTimer: ReturnType<typeof setTimeout> | null = null;
  private self: WindowLike | null = null;
  private rateWindowStart = 0;
  private rateCount = 0;
  private readonly seen = new Set<string>();
  private readonly seenOrder: string[] = [];

  constructor(options: HostBridgeOptions) {
    this.options = options;
    this.config = options.config;
  }

  get status(): HostBridgeStatus {
    return this.currentStatus;
  }

  /** Host methods this session offers, after the allowlist. */
  get hostMethods(): HostMethodName[] {
    const implemented = Object.keys(this.options.methods ?? {}) as HostMethodName[];
    const allowed = this.options.allowedMethods;
    return allowed ? implemented.filter((name) => allowed.includes(name)) : implemented;
  }

  start() {
    if (this.currentStatus !== "waiting" || this.self || this.endpoint) return;
    // Lets a page reset what an earlier bridge for the same frame reported.
    this.options.onStatus?.(this.currentStatus);
    if (this.options.transport) {
      this.connect(this.options.transport, null);
      return;
    }
    const self: WindowLike | null =
      this.options.self ?? (typeof window !== "undefined" ? window : null);
    if (!self) throw new Error("HostBridge needs a window or a transport");
    this.self = self;
    self.addEventListener("message", this.onWindowMessage);
    this.handshakeTimer = setTimeout(() => {
      if (this.currentStatus === "waiting") this.setStatus("unbridged");
    }, this.options.handshakeTimeoutMs ?? 5000);
  }

  /** Function calls into the game (its contract methods plus the builtins). */
  call<K extends keyof GameMethods<C> & string>(
    method: K,
    ...args: MethodArgs<GameMethods<C>[K]>
  ): Promise<MethodResult<GameMethods<C>[K]>> {
    if (!this.endpoint || this.currentStatus !== "connected") {
      return Promise.reject(new BridgeError("unavailable", `No game for ${method}`));
    }
    return this.endpoint.call(method, args) as Promise<MethodResult<GameMethods<C>[K]>>;
  }

  /** Send a config patch (e.g. the editor's live card edits). */
  setConfig(patch: Partial<C["config"]> | C["config"]) {
    this.config = mergeConfig(this.config, patch);
    this.endpoint?.send({ kind: "config", config: patch });
  }

  readonly state = {
    set: (key: string, value: unknown) => {
      if (this.endpoint) this.endpoint.setState(key, value);
      else this.pendingState[key] = value;
    },
  };

  close() {
    if (this.currentStatus === "closed") return;
    this.clearHandshake();
    this.self?.removeEventListener("message", this.onWindowMessage);
    this.self = null;
    this.endpoint?.close();
    this.endpoint = null;
    this.setStatus("closed");
  }

  private readonly onWindowMessage = (event: MessageEvent) => {
    const frame = this.options.frame?.();
    if (!frame || !isHello(event.data) || !this.fromChildFrame(event, frame)) {
      return;
    }
    const hello = event.data;
    if (measureBytes(hello) > (this.options.maxMessageBytes ?? DEFAULT_MAX_MESSAGE_BYTES)) {
      this.drop("too-large", null);
      return;
    }
    if (hello.nonce === this.nonce || hello.nonce === this.rejectedNonce) return;
    if (
      ![BRIDGE_PROTOCOL, BRIDGE_PROTOCOL - 1].includes(hello.protocol) ||
      this.options.acceptHello?.(hello) === false
    ) {
      this.rejectedNonce = hello.nonce;
      this.drop("rejected", hello);
      return;
    }

    if (!this.withinRate()) return this.drop("rate-limited", hello);
    const channel = new MessageChannel();
    this.connect(portTransport(channel.port1), hello);
    const welcome: WelcomeMessage = {
      bridge: BRIDGE_TAG,
      type: "welcome",
      protocol: hello.protocol,
      nonce: hello.nonce,
    };
    frame.postMessage(welcome, "*", [channel.port2]);
  };

  /**
   * Whether a message comes from the game frame. A sandboxed build's origin is
   * "null", so the window is the check. WebKit hands out a new `event.source`
   * proxy per message once the iframe has been moved in the DOM (streamed
   * pages do), so a child window of this page counts too. The port still only
   * ever goes to `frame`, and only the game that sent the hello knows its nonce.
   */
  private fromChildFrame(event: MessageEvent, frame: WindowLike): boolean {
    if (event.source === frame) return true;
    const source = event.source as { parent?: unknown } | null;
    return source !== null && source.parent === this.self;
  }

  private connect(transport: Transport, hello: HelloMessage | null) {
    // A new nonce means the frame reloaded: drop the old connection.
    this.endpoint?.close();
    this.clearHandshake();
    this.nonce = hello?.nonce ?? null;
    this.contract = hello?.contract ?? null;
    this.seen.clear();
    this.seenOrder.length = 0;

    const endpoint = new Endpoint({
      transport,
      callTimeoutMs: this.options.callTimeoutMs,
      resolveMethod: (name) => this.resolveMethod(name),
    });
    this.endpoint = endpoint;
    transport.listen((data) => this.receive(endpoint, data));

    endpoint.send({
      kind: "init",
      context: { ...this.options.context, hostMethods: this.hostMethods },
      config: this.config,
    });
    for (const [key, value] of Object.entries(this.pendingState)) {
      endpoint.setState(key, value);
    }
    this.pendingState = {};
    this.setStatus("connected");
  }

  private receive(endpoint: Endpoint, data: unknown) {
    if (endpoint !== this.endpoint) return;
    const maxBytes = this.options.maxMessageBytes ?? DEFAULT_MAX_MESSAGE_BYTES;
    if (measureBytes(data) > maxBytes) return this.drop("too-large", null);

    const message = parsePortMessage(data);
    if (!message) return this.drop("malformed", data);
    if (message.kind === "init" || message.kind === "config") {
      return this.drop("unexpected", data);
    }
    if (!this.withinRate()) return this.drop("rate-limited", message);
    if (endpoint.handle(message)) return;

    switch (message.kind) {
      case "event": {
        if (this.seen.has(message.eventId)) return this.drop("duplicate", message);
        this.remember(message.eventId);
        const payload = this.options.validateEvent
          ? this.options.validateEvent(message.name, message.payload)
          : message.payload;
        if (!payload) return this.drop("invalid", message);
        this.stats.events++;
        this.options.onEvent?.({
          eventId: message.eventId,
          name: message.name,
          payload,
          at: message.at,
          sessionId: this.options.context.sessionId,
          contract: this.contract,
        });
        return;
      }
      case "state": {
        const values = this.options.validateState
          ? this.options.validateState(message.values)
          : message.values;
        if (!values) return this.drop("invalid", message);
        this.options.onState?.(values);
        return;
      }
      case "lifecycle":
        this.options.onLifecycle?.(message.phase, message.detail);
        return;
    }
  }

  private resolveMethod(name: string): AnyMethod | BridgeErrorCode {
    const methods = this.options.methods as Record<string, unknown> | undefined;
    const method = methods?.[name];
    if (typeof method !== "function") return "unknown-method";
    if (!this.hostMethods.includes(name as HostMethodName)) return "not-allowed";
    return (...args: unknown[]) => (method as AnyMethod).apply(methods, args);
  }

  private withinRate(): boolean {
    const now = Date.now();
    if (now - this.rateWindowStart >= 1000) {
      this.rateWindowStart = now;
      this.rateCount = 0;
    }
    this.rateCount++;
    return this.rateCount <= (this.options.maxEventsPerSecond ?? DEFAULT_MAX_EVENTS_PER_SECOND);
  }

  private remember(id: string) {
    this.seen.add(id);
    this.seenOrder.push(id);
    if (this.seenOrder.length > DEDUPE_WINDOW) this.seen.delete(this.seenOrder.shift() ?? "");
  }

  private drop(reason: DropReason, data: unknown) {
    this.stats.dropped[reason] = (this.stats.dropped[reason] ?? 0) + 1;
    this.options.onDrop?.(reason, data);
  }

  private setStatus(status: HostBridgeStatus) {
    if (this.currentStatus === status) return;
    this.currentStatus = status;
    this.options.onStatus?.(status);
  }

  private clearHandshake() {
    if (this.handshakeTimer) clearTimeout(this.handshakeTimer);
    this.handshakeTimer = null;
  }
}

interface SafeParser {
  safeParse(value: unknown): { success: true; data: unknown } | { success: false };
}

/**
 * `validateEvent` from a contract's event schemas (zod or anything with
 * `safeParse`). Unknown event names are dropped; payloads come back parsed,
 * so unknown keys are stripped.
 */
export function createEventValidator(
  schemas: Record<string, SchemaLike & SafeParser>,
): NonNullable<HostBridgeOptions["validateEvent"]> {
  return (name, payload) => {
    if (!Object.hasOwn(schemas, name)) return null;
    const result = schemas[name]?.safeParse(payload);
    return result?.success ? (result.data as Record<string, unknown>) : null;
  };
}
