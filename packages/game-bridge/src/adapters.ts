/**
 * Engine glue that needs no engine import. The Phaser adapter lives in
 * `phaser-core`, next to the Phaser types it uses.
 */

import type { EngineAdapter } from "./contract";

/** Pages with no game loop: restart only. */
export function domAdapter(options: {
  restart(): void;
  pause?(): void;
  resume?(): void;
  snapshot?(): ReturnType<NonNullable<EngineAdapter["snapshot"]>>;
}): EngineAdapter {
  return {
    pause: () => options.pause?.(),
    resume: () => options.resume?.(),
    restart: () => options.restart(),
    snapshot: options.snapshot,
  };
}

/** The slice of `gdjs.RuntimeGame` the adapter drives (also met by stand-ins). */
export interface GDevelopRuntimeLike {
  pause(enable: boolean): void;
  getSceneStack(): {
    getCurrentScene(): { getName(): string } | null;
    replace(sceneName: string, clear?: boolean): void;
  };
}

/** A GDevelop export; `resolve` is read on every call, so load order doesn't matter. */
export function gdevelopAdapter(
  resolve: () => GDevelopRuntimeLike | null | undefined,
): EngineAdapter {
  return {
    pause: () => resolve()?.pause(true),
    resume: () => resolve()?.pause(false),
    restart: () => {
      const stack = resolve()?.getSceneStack();
      const scene = stack?.getCurrentScene();
      if (stack && scene) stack.replace(scene.getName(), true);
    },
    snapshot: () => ({
      engine: "gdevelop",
      scene: resolve()?.getSceneStack().getCurrentScene()?.getName() ?? null,
    }),
  };
}

/**
 * For the drop-in script: drives a GDevelop runtime when the page exposes one,
 * otherwise restarts by reloading the page.
 */
export function autoAdapter(): EngineAdapter {
  const runtime = () => (window as { __GDEVELOP_GAME__?: GDevelopRuntimeLike }).__GDEVELOP_GAME__;
  const gdevelop = gdevelopAdapter(runtime);
  return {
    pause: () => gdevelop.pause(),
    resume: () => gdevelop.resume(),
    restart: () => (runtime() ? gdevelop.restart() : location.reload()),
    snapshot: () => (runtime() ? (gdevelop.snapshot?.() ?? null) : { engine: "unknown" }),
  };
}
