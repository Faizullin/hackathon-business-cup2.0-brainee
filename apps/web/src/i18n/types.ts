import type { en } from "./en";

// `en` is declared `as const`; widen its literal leaves so consumers get plain strings.
type DeepDictionary<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R extends string ? string : R
  : T extends readonly (infer U)[]
    ? readonly DeepDictionary<U>[]
    : T extends object
      ? { [K in keyof T]: DeepDictionary<T[K]> }
      : string;

/** The platform is English-only; the bridge still sends this locale to games. */
export type Locale = "en";
export type Dictionary = DeepDictionary<typeof en>;
