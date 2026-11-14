import type { FrameLocator } from "@playwright/test";

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
  if (typeof roundIndex === "number") {
    await frame
      .locator(".session-progress")
      .filter({ hasText: `Ритм ${roundIndex + 1} из 4` })
      .waitFor({ state: "visible", timeout: 10000 });
  }

  // Wait until user's turn
  await frame
    .locator("[data-prompt]")
    .filter({ hasText: "Твоя очередь" })
    .waitFor({ state: "visible", timeout: 10000 });

  const inputSequence = makeMistake
    ? pattern.map((act, i) =>
        i === pattern.length - 1 ? (act === "clap" ? "stomp" : "clap") : act,
      )
    : [...pattern];

  for (const action of inputSequence) {
    const pad = frame.locator(`.rc-pad[data-pad="${action}"]`);
    await pad.click({ delay: 60 });
    await new Promise((r) => setTimeout(r, 120));
  }
}
