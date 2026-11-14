/**
 * Game-safe entry: no runtime dependencies, so it can go into game bundles.
 * Hosts import zod learning schemas from the separate learning entry.
 */

export {
  autoAdapter,
  domAdapter,
  type GDevelopRuntimeLike,
  gdevelopAdapter,
} from "./adapters";
export {
  BUILTIN_GAME_METHODS,
  type BuiltinGameMethods,
  type DefineContract,
  type EngineAdapter,
  type EventsOf,
  type GameContract,
  type GameMethods,
  type HostMethodName,
  type HostMethods,
  type Implementation,
  type MethodArgs,
  type MethodResult,
  type SchemaLike,
} from "./contract";
export { DEFAULT_CALL_TIMEOUT_MS, STATE_INTERVAL_MS } from "./endpoint";
export {
  contextFromUrl,
  DEFAULT_HANDSHAKE_TIMEOUT_MS,
  GameBridge,
  type GameBridgeFallback,
  type GameBridgeOptions,
  type GameBridgeStatus,
} from "./game";
export {
  type BridgeEvent,
  createEventValidator,
  DEFAULT_MAX_EVENTS_PER_SECOND,
  DEFAULT_MAX_MESSAGE_BYTES,
  type DropReason,
  HostBridge,
  type HostBridgeOptions,
  type HostBridgeStatus,
} from "./host";

export {
  BRIDGE_ERROR_CODES,
  BRIDGE_PROTOCOL,
  BRIDGE_TAG,
  BridgeError,
  type BridgeErrorCode,
  createId,
  GAME_PHASES,
  type GamePhase,
  type HelloMessage,
  isHello,
  isWelcome,
  type JsonValue,
  type LaunchContext,
  LOCALES,
  type Locale,
  mergeConfig,
  type PortMessage,
  parsePortMessage,
  type WelcomeMessage,
  type WindowLike,
} from "./protocol";

export {
  createInProcessPair,
  portTransport,
  type Transport,
} from "./transport";
