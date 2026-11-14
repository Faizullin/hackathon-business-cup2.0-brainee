import { z } from "zod";

const testEvents = { target_selected: z.object({ target: z.number().int().nonnegative() }) };

import assert from "node:assert/strict";
import { afterEach, describe, test } from "vitest";

import {
  type BridgeEvent,
  createEventValidator,
  createInProcessPair,
  type DefineContract,
  type EngineAdapter,
  GameBridge,
  type GamePhase,
  HostBridge,
  type HostBridgeOptions,
  type WindowLike,
} from "./index";

type PuzzleContract = DefineContract<{
  config: { level: number; cardIds: number[]; locale: "en" | "ru" | "kk" };
  events: {
    target_selected: { target: number };
    piece_placed: { piece: number; attempts: number };
  };
  state: { placed: number; total: number };
  methods: { setLevel(level: number): void; hang(): Promise<void> };
}>;

/** Two fake windows: whatever one posts lands on the other's listeners. */
function createFrames() {
  const make = (): WindowLike & {
    listeners: Set<(event: MessageEvent) => void>;
  } => {
    const listeners = new Set<(event: MessageEvent) => void>();
    return {
      listeners,
      postMessage() {},
      addEventListener: (_type, listener) => void listeners.add(listener),
      removeEventListener: (_type, listener) => void listeners.delete(listener),
    };
  };
  const host = make();
  const game = make();
  const link = (target: typeof host, source: typeof host) => {
    target.postMessage = (data: unknown, _origin: string, transfer: Transferable[] = []) => {
      const ports = transfer.filter((item): item is MessagePort => item instanceof MessagePort);
      setTimeout(() => {
        const event = {
          data: structuredClone(data),
          source,
          ports,
        } as unknown as MessageEvent;
        for (const listener of target.listeners) listener(event);
      }, 0);
    };
  };
  link(host, game);
  link(game, host);
  return { host, game };
}

async function until(check: () => boolean, timeoutMs = 1000) {
  const started = Date.now();
  while (!check()) {
    if (Date.now() - started > timeoutMs) throw new Error("Timed out waiting");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

const open: Array<{ close(): void }> = [];
afterEach(() => {
  for (const bridge of open.splice(0)) bridge.close();
});

const context = {
  sessionId: "session-1",
  gameId: "phaser-picture-puzzle-game",
  version: "1.0.0",
  locale: "ru" as const,
};
const config = { level: 1, cardIds: [1, 2, 3], locale: "ru" as const };

function setup(
  hostOptions: Partial<HostBridgeOptions> = {},
  gameOptions: Partial<Parameters<typeof GameBridge.connect<PuzzleContract>>[0]> = {},
) {
  const frames = createFrames();
  const events: BridgeEvent[] = [];
  const states: Record<string, unknown>[] = [];
  const phases: GamePhase[] = [];
  const host = new HostBridge<PuzzleContract>({
    self: frames.host,
    frame: () => frames.game,
    context,
    config,
    onEvent: (event) => events.push(event),
    onState: (values) => states.push(values),
    onLifecycle: (phase) => phases.push(phase),
    ...hostOptions,
  });
  host.start();
  const game = GameBridge.connect<PuzzleContract>({
    contract: "puzzle@1",
    self: frames.game,
    parent: frames.host,
    helloIntervalMs: 20,
    ...gameOptions,
  });
  open.push(host, game);
  return { frames, host, game, events, states, phases };
}

describe("handshake", () => {
  test("connects over a private port and delivers init", async () => {
    const { host, game } = setup({ methods: { "session.exit": async () => {} } });
    assert.equal(await game.ready, true);
    assert.equal(host.status, "connected");
    assert.equal(host.contract, "puzzle@1");
    assert.deepEqual(game.config, config);
    assert.equal(game.context?.sessionId, "session-1");
    assert.deepEqual(game.context?.hostMethods, ["session.exit"]);
  });

  test("ignores a hello from any window but the frame", async () => {
    const frames = createFrames();
    const stranger = createFrames().game;
    const host = new HostBridge({
      self: frames.host,
      frame: () => stranger,
      context,
      config,
    });
    host.start();
    const game = GameBridge.connect({
      contract: "puzzle@1",
      self: frames.game,
      parent: frames.host,
      handshakeTimeoutMs: 80,
      helloIntervalMs: 20,
    });
    open.push(host, game);
    assert.equal(await game.ready, false);
    assert.equal(host.status, "waiting");
  });

  test("runs unbridged with the fallback when nobody answers", async () => {
    const frames = createFrames();
    const game = GameBridge.connect<PuzzleContract>({
      contract: "puzzle@1",
      self: frames.game,
      parent: frames.host,
      handshakeTimeoutMs: 50,
      fallback: () => ({
        context: { locale: "kk" },
        config: { ...config, level: 4 },
      }),
    });
    open.push(game);
    assert.equal(await game.ready, false);
    assert.equal(game.status, "unbridged");
    assert.equal(game.context?.locale, "kk");
    assert.equal(game.config?.level, 4);
    game.track("piece_placed", { piece: 1, attempts: 1 }); // buffered, no throw
    await assert.rejects(game.host.call("session.exit"), {
      code: "unavailable",
    });
  });

  test("refuses a contract the host doesn't accept", async () => {
    const { host, game } = setup(
      { acceptHello: (hello) => hello.contract !== "puzzle@1" },
      { handshakeTimeoutMs: 80 },
    );
    assert.equal(await game.ready, false);
    assert.equal(host.stats.dropped.rejected, 1);
  });

  test("reconnects when the frame reloads", async () => {
    const { frames, host, game, events } = setup();
    await game.ready;
    game.close();
    const reloaded = GameBridge.connect<PuzzleContract>({
      contract: "puzzle@1",
      self: frames.game,
      parent: frames.host,
      helloIntervalMs: 20,
    });
    open.push(reloaded);
    assert.equal(await reloaded.ready, true);
    reloaded.track("piece_placed", { piece: 2, attempts: 1 });
    await until(() => events.length === 1);
    assert.equal(host.status, "connected");
  });
});

describe("WebKit window proxies", () => {
  test("accepts a hello whose source is another proxy of a child window", async () => {
    const frames = createFrames();
    const host = new HostBridge({ self: frames.host, frame: () => frames.game, context, config });
    host.start();
    open.push(host);
    // WebKit hands out a fresh proxy per message once the iframe was moved in the DOM.
    const proxy = { parent: frames.host };
    const hello = {
      bridge: "brainee",
      type: "hello",
      protocol: 2,
      contract: "puzzle@1",
      nonce: "n-1",
    };
    for (const listener of frames.host.listeners) {
      listener({ data: hello, source: proxy, ports: [] } as unknown as MessageEvent);
    }
    await until(() => host.status === "connected");
    assert.equal(host.contract, "puzzle@1");
  });
});

describe("late hosts", () => {
  test("a host that starts after the handshake timeout still connects", async () => {
    const frames = createFrames();
    const game = GameBridge.connect<PuzzleContract>({
      contract: "puzzle@1",
      self: frames.game,
      parent: frames.host,
      helloIntervalMs: 10,
      handshakeTimeoutMs: 40,
      lateHelloIntervalMs: 20,
    });
    open.push(game);
    assert.equal(await game.ready, false);
    assert.equal(game.status, "unbridged");
    // Reported while unbridged: kept for a host that turns up later.
    game.track("target_selected", { target: 3 });

    const events: BridgeEvent[] = [];
    const host = new HostBridge({
      self: frames.host,
      frame: () => frames.game,
      context,
      config,
      onEvent: (event) => events.push(event),
    });
    host.start();
    open.push(host);
    await until(() => host.status === "connected");
    await until(() => events.length === 1);
    assert.equal(game.status, "connected");
    assert.equal(game.context?.sessionId, "session-1");
    assert.equal(events[0].name, "target_selected");
  });

  test("start reports waiting, so a page can reset an earlier bridge's status", async () => {
    const statuses: string[] = [];
    const { host } = setup({ onStatus: (status) => statuses.push(status) });
    await until(() => host.status === "connected");
    assert.deepEqual(statuses, ["waiting", "connected"]);
  });
});

describe("events and lifecycle", () => {
  test("buffers events before the handshake and keeps their order", async () => {
    const { game, events } = setup();
    game.track("piece_placed", { piece: 1, attempts: 2 });
    game.track("target_selected", { target: 7 });
    await game.ready;
    game.track("piece_placed", { piece: 2, attempts: 1 });
    await until(() => events.length === 3);
    assert.deepEqual(
      events.map((event) => event.name),
      ["piece_placed", "target_selected", "piece_placed"],
    );
    assert.equal(events[0].sessionId, "session-1");
    assert.equal(events[0].contract, "puzzle@1");
  });

  test("validates payloads with the contract's schemas", async () => {
    const { game, events, host } = setup({
      validateEvent: createEventValidator(testEvents),
    });
    await game.ready;
    game.track("target_selected", { target: -1 });
    game.track("piece_placed", { piece: 1, attempts: 1 }); // not in the schemas
    game.track("target_selected", {
      target: 3,
      extra: "stripped",
    } as { target: number });
    await until(() => events.length === 1);
    await until(() => host.stats.dropped.invalid === 2);
    assert.deepEqual(events[0].payload, { target: 3 });
  });

  test("reports lifecycle phases", async () => {
    const { game, phases } = setup();
    game.lifecycle("ready");
    await game.ready;
    game.lifecycle("completed", { durationMs: 1200 });
    await until(() => phases.length === 2);
    assert.deepEqual(phases, ["ready", "completed"]);
  });
});

describe("function calls", () => {
  test("host exit is allowlisted", async () => {
    let exits = 0;
    const { game } = setup({
      methods: {
        "session.exit": () => {
          exits++;
        },
      },
    });
    await game.ready;
    await game.host.call("session.exit");
    assert.equal(exits, 1);
  });

  test("host → game contract methods and adapter builtins", async () => {
    const levels: number[] = [];
    const adapterCalls: string[] = [];
    const adapter: EngineAdapter = {
      pause: () => void adapterCalls.push("pause"),
      resume: () => void adapterCalls.push("resume"),
      restart: () => void adapterCalls.push("restart"),
      snapshot: () => ({ placed: 2 }),
    };
    const { host, game, phases } = setup(
      {},
      { adapter, methods: { setLevel: (level) => void levels.push(level) } },
    );
    await game.ready;
    await host.call("setLevel", 3);
    await host.call("pause");
    assert.deepEqual(await host.call("snapshot"), { placed: 2 });
    assert.deepEqual(levels, [3]);
    assert.deepEqual(adapterCalls, ["pause"]);
    await until(() => phases.includes("paused"));
  });

  test("times out and reports unknown methods", async () => {
    const { host, game } = setup(
      { callTimeoutMs: 50 },
      { methods: { hang: () => new Promise<void>(() => {}) } },
    );
    await game.ready;
    await assert.rejects(host.call("hang"), { code: "timeout" });
    await assert.rejects(host.call("restart"), { code: "unknown-method" });
  });
});

describe("state and config", () => {
  test("fast state keeps only the latest value per key", async () => {
    const { game, states } = setup();
    await game.ready;
    for (let placed = 1; placed <= 10; placed++) game.state.set("placed", placed);
    game.state.set("total", 12);
    await until(() => states.length > 0);
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.deepEqual(states, [{ placed: 10, total: 12 }]);
  });

  test("host state and config patches reach the game", async () => {
    const { host, game } = setup();
    const configs: unknown[] = [];
    const values: Record<string, unknown>[] = [];
    game.onConfig((value) => configs.push(value));
    game.state.on((value) => values.push(value));
    await game.ready;
    host.setConfig({ level: 2 });
    host.state.set("zoom", 1.5);
    await until(() => configs.length === 2 && values.length === 1);
    assert.deepEqual(game.config, { ...config, level: 2 });
    assert.deepEqual(values, [{ zoom: 1.5 }]);
  });
});

describe("host limits", () => {
  function rawSetup(options: Partial<HostBridgeOptions> = {}) {
    const [hostEnd, gameEnd] = createInProcessPair();
    const events: BridgeEvent[] = [];
    const host = new HostBridge({
      transport: hostEnd,
      context,
      config,
      onEvent: (event) => events.push(event),
      ...options,
    });
    host.start();
    open.push(host);
    const event = (id: string, payload: Record<string, unknown> = {}) =>
      gameEnd.send({
        kind: "event",
        eventId: id,
        name: "target_selected",
        payload,
        at: new Date().toISOString(),
      });
    return { host, gameEnd, events, event };
  }

  test("drops malformed, oversized, unexpected and duplicate messages", async () => {
    const { host, gameEnd, events, event } = rawSetup();
    gameEnd.send({ kind: "nonsense" } as never);
    gameEnd.send({ kind: "config", config: {} });
    event("a", { blob: "x".repeat(70 * 1024) });
    event("binary", { buffer: new ArrayBuffer(70 * 1024) });
    event("b");
    event("b");
    await until(() => events.length === 1);
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(host.stats.dropped, {
      malformed: 1,
      unexpected: 1,
      "too-large": 2,
      duplicate: 1,
    });
  });

  test("rate-limits events per second", async () => {
    const { host, events, event } = rawSetup({ maxEventsPerSecond: 5 });
    for (let index = 0; index < 8; index++) event(`e${index}`);
    await until(() => (host.stats.dropped["rate-limited"] ?? 0) === 3);
    assert.equal(events.length, 5);
  });

  test("in-process transport skips the window handshake", async () => {
    const [hostEnd, gameEnd] = createInProcessPair();
    const events: BridgeEvent[] = [];
    const host = new HostBridge({
      transport: hostEnd,
      context,
      config,
      onEvent: (event) => events.push(event),
    });
    const game = GameBridge.connect<PuzzleContract>({
      contract: "puzzle@1",
      transport: gameEnd,
    });
    host.start();
    open.push(host, game);
    assert.equal(await game.ready, true);
    game.track("target_selected", { target: 1 });
    await until(() => events.length === 1);
  });
});

describe("protocol compatibility", () => {
  for (const protocol of [1, 2, 0, 3]) {
    test(`host supports only N and N-1: ${protocol}`, async () => {
      const frames = createFrames();
      const host = new HostBridge({ self: frames.host, frame: () => frames.game, context, config });
      open.push(host);
      host.start();
      frames.host.postMessage(
        { bridge: "brainee", type: "hello", protocol, contract: "puzzle@1", nonce: "version-test" },
        "*",
      );
      await until(() => host.status === "connected" || host.stats.dropped.rejected === 1);
      assert.equal(host.status === "connected", protocol === 1 || protocol === 2);
    });
  }
  test("ignores a welcome with a wrong nonce", async () => {
    const frames = createFrames();
    const game = GameBridge.connect({
      contract: "puzzle@1",
      self: frames.game,
      parent: frames.host,
      handshakeTimeoutMs: 20,
    });
    open.push(game);
    const channel = new MessageChannel();
    frames.game.postMessage(
      { bridge: "brainee", type: "welcome", protocol: 2, nonce: "wrong" },
      "*",
      [channel.port2],
    );
    assert.equal(await game.ready, false);
    channel.port1.close();
    channel.port2.close();
  });
});
