import { expect, it } from "vitest";
import { reachedStage } from "./brainy";
import { advanceCalendar, calendarKeys } from "./calendar";
import {
  adultAnswerCorrect,
  changeTimeZone,
  pairingFailure,
  signupTimeZone,
  validChildSettings,
  validPin,
} from "./settings";
import type { Showcase } from "./showcase";

const now = new Date("2026-11-16T04:30:00Z");
it("validates age, promises, PIN and supported signup zones", () => {
  expect(signupTimeZone("America/Phoenix")).toBe("America/Phoenix");
  expect(signupTimeZone("Mars/Olympus")).toBe("America/New_York");
  expect(validChildSettings({ name: "Mira", birthYear: 2020, promise: 5 }, now)).toBe(true);
  for (const patch of [
    { name: " " },
    { birthYear: 2010 },
    { birthYear: 2025 },
    { promise: 0 },
    { promise: 6 },
  ])
    expect(validChildSettings({ name: "Mira", birthYear: 2020, promise: 3, ...patch }, now)).toBe(
      false,
    );
  expect(validPin("0001")).toBe(true);
  expect(validPin("12345")).toBe(false);
  expect(adultAnswerCorrect("68")).toBe(true);
  expect(adultAnswerCorrect("67")).toBe(false);
});
it("locks the fifth wrong pairing attempt for ten minutes", () => {
  expect(pairingFailure(3, now)).toEqual({ attempts: 4, lockedUntil: null });
  expect(pairingFailure(4, now)).toEqual({
    attempts: 0,
    lockedUntil: new Date(now.getTime() + 600000),
  });
});
it("changing zones settles Monday immediately and never renews a claimed daily bonus", () => {
  const data = {
    calendar: { timeZone: "America/New_York", ...calendarKeys(now), bonusGiven: true },
    tasks: [],
    weekGoal: { earned: 8, target: 10, giftId: "gift", due: "Sunday" },
  } as unknown as Showcase;
  const east = changeTimeZone(data, "Asia/Almaty", now);
  expect(east.showcase.weekGoal.earned).toBe(0);
  expect(east.showcase.calendar).toMatchObject({ day: "2026-11-16", bonusGiven: true });
  const west = changeTimeZone(east.showcase, "America/Los_Angeles", now);
  expect(west.showcase.calendar).toMatchObject({ day: "2026-11-15", bonusGiven: true });
  expect(
    advanceCalendar(west.showcase, new Date("2026-11-16T08:00:00Z")).showcase.calendar?.bonusGiven,
  ).toBe(false);
  expect(data.weekGoal.earned).toBe(8);
});
it("celebrates only a higher stage", () => {
  const before = { brain: 24, eyes: 24, mouth: 24, arms: 24, legs: 24, resp: 0 };
  expect(reachedStage(before, { ...before, brain: 30 })).toBe("awake");
  expect(reachedStage(before, before)).toBeNull();
  expect(reachedStage({ ...before, brain: 30 }, before)).toBeNull();
});
