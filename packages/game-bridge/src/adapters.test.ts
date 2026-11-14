import assert from "node:assert/strict";
import { afterEach, describe, test } from "vitest";
import {
  createInProcessPair,
  domAdapter,
  GameBridge,
  type GamePhase,
  type GDevelopRuntimeLike,
  gdevelopAdapter,
  HostBridge,
  type HostBridgeOptions,
} from "./index";

const context = {
  sessionId: "session-1",
  gameId: "gdevelop-test-game",
  version: "1.0.0",
  locale: "kk" as const,
};

const open: Array<{ close(): void }> = [];
afterEach(() => {
  for (const bridge of open.splice(0)) bridge.close();
});

/** Host and game in one process, connected and initialised. */
async function connect(
  adapter: Parameters<typeof GameBridge.connect>[0]["adapter"],
  hostOptions: Partial<HostBridgeOptions> = {},
) {
  const [hostEnd, gameEnd] = createInProcessPair();
  const phases: GamePhase[] = [];
  const host = new HostBridge({
    transport: hostEnd,
    context,
    config: null,
    onLifecycle: (phase) => phases.push(phase),
    ...hostOptions,
  });
  const game = GameBridge.connect({ contract: "test@1", transport: gameEnd, adapter });
  host.start();
  open.push(host, game);
  assert.equal(await game.ready, true);
  return { host, game, phases };
}

function fakeRuntime() {
  const calls: string[] = [];
  const runtime: GDevelopRuntimeLike = {
    pause: (enable) => void calls.push(enable ? "pause" : "resume"),
    getSceneStack: () => ({
      getCurrentScene: () => ({ getName: () => "Level 1" }),
      replace: (name, clear) => void calls.push(`replace:${name}:${clear}`),
    }),
  };
  return { runtime, calls };
}

describe("gdevelopAdapter", () => {
  test("drives the runtime for the host's builtin calls", async () => {
    const { runtime, calls } = fakeRuntime();
    const { host, phases } = await connect(gdevelopAdapter(() => runtime));

    await host.call("pause");
    await host.call("resume");
    await host.call("restart");
    assert.deepEqual(await host.call("snapshot"), {
      engine: "gdevelop",
      scene: "Level 1",
    });
    assert.deepEqual(calls, ["pause", "resume", "replace:Level 1:true"]);
    assert.deepEqual(phases, ["paused", "resumed", "started"]);
  });

  test("waits for a runtime that appears later", async () => {
    const page: { runtime?: GDevelopRuntimeLike } = {};
    const { host } = await connect(gdevelopAdapter(() => page.runtime));
    assert.deepEqual(await host.call("snapshot"), { engine: "gdevelop", scene: null });

    const fake = fakeRuntime();
    page.runtime = fake.runtime;
    await host.call("pause");
    assert.deepEqual(fake.calls, ["pause"]);
  });
});

describe("domAdapter", () => {
  test("restarts the page's own game; pause and resume are optional", async () => {
    let restarts = 0;
    const { host } = await connect(domAdapter({ restart: () => void restarts++ }));
    await host.call("pause");
    await host.call("restart");
    assert.equal(restarts, 1);
    // Without a snapshot from the game there is nothing to answer with.
    await assert.rejects(host.call("snapshot"), { code: "unknown-method" });
  });
});
