import { expect, type FrameLocator } from "@playwright/test";

const ACTIONS = ["clap", "stomp", "tap", "shake"];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getRhythmPattern(level: number, roundIndex: number, seed = 42): string[] {
  const roundRng = mulberry32(seed + roundIndex * 79 + level * 17);
  const pickAction = (): string => ACTIONS[Math.floor(roundRng() * ACTIONS.length)] ?? "clap";

  if (level === 1) {
    const p: string[] = [];
    for (let i = 0; i < 5; i++) p.push(pickAction());
    return p;
  }
  if (level === 2) {
    const c0 = pickAction();
    const c1 = pickAction();
    const c2 = pickAction();
    return [c0, c1, c2, c0, c1, pickAction()];
  }
  const a = pickAction();
  const b = pickAction();
  const c = pickAction();
  const d = pickAction();
  return [a, b, a, b, c, c, d, d];
}

export async function playRhythmInput(
  frame: FrameLocator,
  pattern: string[],
  makeMistake = false,
  roundIndex?: number,
) {
  const text =
    RHYTHM_TEXT[(await frame.locator("html").getAttribute("lang")) === "en" ? "en" : "ru"];
  if (typeof roundIndex === "number")
    await expect(frame.locator(".session-progress")).toHaveText(text.progress(roundIndex + 1), {
      timeout: 10000,
    });

  // Input opens only after the demo; the copy must match the issued locale.
  await expect(frame.locator("#game")).toHaveAttribute("data-turn", "player", { timeout: 10000 });
  await expect(frame.locator("[data-prompt]")).toHaveText(text.turn);

  const inputSequence = makeMistake
    ? pattern.map((act, i) =>
        i === pattern.length - 1 ? (act === "clap" ? "stomp" : "clap") : act,
      )
    : [...pattern];

  for (const [i, action] of inputSequence.entries()) {
    await frame.locator(`.rc-pad[data-pad="${action}"]`).click({ delay: 60 });
    // Every tap must land exactly once before the next one.
    if (i < inputSequence.length - 1)
      await expect(frame.locator(".rc-chip.is-shown")).toHaveCount(i + 1);
  }
}

const RHYTHM_TEXT = {
  ru: { progress: (n: number) => `Ритм ${n} из 4`, turn: "Твоя очередь!" },
  en: { progress: (n: number) => `Rhythm ${n} of 4`, turn: "Your turn!" },
};
