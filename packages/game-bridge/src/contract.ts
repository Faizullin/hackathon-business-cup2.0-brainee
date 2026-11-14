/**
 * Per-game typing. A game describes its config, events, state and methods
 * once (`DefineContract`); `GameBridge<C>` and `HostBridge<C>` then type every
 * call. The zod schemas live next to the types in each game's `contract.ts`:
 * the host imports the schemas, the game imports only the types.
 */

import type { JsonValue } from "./protocol";

type AnyMethod = (...args: never[]) => unknown;

export interface GameContract {
  config: unknown;
  events: Record<string, object>;
  state: Record<string, unknown>;
  /** Host → game methods the game implements. */
  methods: Record<string, AnyMethod>;
}

/** Identity helper that checks a contract against `GameContract`. */
export type DefineContract<C extends GameContract> = C;

/** Anything zod-shaped (`z.infer` without importing zod into game bundles). */
export interface SchemaLike<T = unknown> {
  _zod: { output: T };
}

/** `{ name: z.object(...) }` → `{ name: Payload }`. */
export type EventsOf<S extends Record<string, SchemaLike>> = {
  [K in keyof S]: S[K]["_zod"]["output"];
};

/** What every host offers. The game can't reach the store's API any other way. */
export type HostMethods = {
  "session.exit"(): void;
};

export type HostMethodName = keyof HostMethods;

/** Methods every bridged game answers, backed by its `EngineAdapter`. */
export type BuiltinGameMethods = {
  pause(): void;
  resume(): void;
  restart(): void;
  snapshot(): JsonValue | ArrayBuffer | null;
};

export const BUILTIN_GAME_METHODS = [
  "pause",
  "resume",
  "restart",
  "snapshot",
] as const satisfies readonly (keyof BuiltinGameMethods)[];

export type GameMethods<C extends GameContract> = C["methods"] & BuiltinGameMethods;

/** Engine glue: about five members, each adapter about 30 lines. */
export interface EngineAdapter {
  pause(): void;
  resume(): void;
  restart(): void;
  snapshot?(): JsonValue | ArrayBuffer | null | Promise<JsonValue | ArrayBuffer | null>;
  /** Calls `cb` once per rendered frame; returns an unsubscribe. */
  onFrame?(cb: () => void): () => void;
}

export type MethodArgs<F> = F extends (...args: infer A) => unknown ? A : never;
export type MethodResult<F> = F extends (...args: never[]) => infer R ? Awaited<R> : never;

/** The implementation side of a method map: sync or async is fine. */
export type Implementation<M> = {
  [K in keyof M]: (...args: MethodArgs<M[K]>) => MethodResult<M[K]> | Promise<MethodResult<M[K]>>;
};
