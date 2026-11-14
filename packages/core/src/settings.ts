import { advanceCalendar, calendarKeys, DEFAULT_TIME_ZONE } from "./calendar";
import type { Showcase } from "./showcase";

export const TIME_ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Asia/Almaty",
  "Asia/Tashkent",
  "Europe/Moscow",
  "UTC",
] as const;
export const supportedTimeZone = (value: unknown): value is (typeof TIME_ZONES)[number] =>
  typeof value === "string" && TIME_ZONES.includes(value as (typeof TIME_ZONES)[number]);
export const signupTimeZone = (value: unknown) =>
  supportedTimeZone(value) ? value : DEFAULT_TIME_ZONE;
export const PAIRING_MS = 15 * 60_000;
export const PAIRING_LOCK_MS = 10 * 60_000;
export const PAIRING_TRIES = 5;
export const adultAnswerCorrect = (answer: unknown) =>
  typeof answer === "string" && answer.trim() === "68";
export const validPin = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}$/.test(value);
export type ChildSettings = { name: string; birthYear: number; promise: number };
export function validChildSettings(value: unknown, now: Date): value is ChildSettings {
  const v = value as Partial<ChildSettings> | null;
  const age = now.getUTCFullYear() - Number(v?.birthYear);
  return (
    !!v &&
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    v.name.trim().length <= 40 &&
    Number.isInteger(v.birthYear) &&
    age >= 4 &&
    age <= 10 &&
    Number.isInteger(v.promise) &&
    Number(v.promise) >= 1 &&
    Number(v.promise) <= 5
  );
}
export function pairingFailure(attempts: number, now: Date) {
  const count = attempts + 1;
  return {
    attempts: count >= PAIRING_TRIES ? 0 : count,
    lockedUntil: count >= PAIRING_TRIES ? new Date(now.getTime() + PAIRING_LOCK_MS) : null,
  };
}
/** Settle the old zone first; rebase to the selected local date without paying another bonus. */
export function changeTimeZone(showcase: Showcase, zone: string, now: Date) {
  if (!supportedTimeZone(zone)) throw new RangeError("Unsupported timezone");
  const settled = advanceCalendar(showcase, now);
  const previous = settled.showcase.calendar;
  const shifted = advanceCalendar(
    { ...settled.showcase, calendar: previous ? { ...previous, timeZone: zone } : undefined },
    now,
  );
  const next = structuredClone(shifted.showcase);
  next.calendar = {
    timeZone: zone,
    ...calendarKeys(now, zone),
    bonusGiven: previous?.bonusGiven ?? false,
  };
  return {
    showcase: next,
    dayChanged: settled.dayChanged || shifted.dayChanged || previous?.day !== next.calendar.day,
  };
}
