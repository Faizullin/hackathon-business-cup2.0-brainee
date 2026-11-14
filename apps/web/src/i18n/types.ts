import type { ru } from "./ru";

type DeepDictionary<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R extends string ? string : R
  : T extends readonly (infer U)[]
    ? readonly DeepDictionary<U>[]
    : T extends object
      ? { [K in keyof T]: DeepDictionary<T[K]> }
      : string;

export type Locale = "en" | "ru";
export type Dictionary = DeepDictionary<typeof ru>;
