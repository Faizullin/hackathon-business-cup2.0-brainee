import { expect, type FrameLocator } from "@playwright/test";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getSecretMessagePattern(level: number, roundIndex: number, seed = 42): string[] {
  const roundRng = mulberry32(seed + roundIndex * 83 + level * 29);
  let pool = ["star", "moon", "heart"];
  let len = 5;

  if (level === 2) {
    pool = ["star", "moon", "heart", "sun"];
    len = 6;
  } else if (level === 3) {
    pool = ["star", "moon", "heart", "leaf", "sun"];
    len = 7;
  }

  const res: string[] = [];
  for (let i = 0; i < len; i++) {
    const sym = pool[Math.floor(roundRng() * pool.length)] ?? "star";
    res.push(sym);
  }
  return res;
}

export async function playSecretMessageInput(
  frame: FrameLocator,
  pattern: string[],
  makeMistake = false,
  roundIndex?: number,
) {
  const text =
    SECRET_TEXT[(await frame.locator("html").getAttribute("lang")) === "en" ? "en" : "ru"];
  if (typeof roundIndex === "number")
    await expect(frame.locator(".session-progress")).toHaveText(text.progress(roundIndex + 1), {
      timeout: 8000,
    });

  const game = frame.locator("#game");
  const checkBtn = frame.getByRole("button", { name: text.check, exact: true });
  await expect(game).toHaveAttribute("data-turn", /^(preview|recall)$/);
  // Check during the preview ends it early. If the preview timer wins the race, the same tap
  // lands in recall with nothing filled, which only prompts and never counts as a mistake.
  if ((await game.getAttribute("data-turn")) === "preview") await checkBtn.click({ delay: 60 });
  await expect(game).toHaveAttribute("data-turn", "recall");

  await frame.locator('[data-action="clear"]').click({ delay: 60 });
  await expect(frame.locator(".copy-slot.is-filled")).toHaveCount(0);
  const sequence = makeMistake
    ? pattern.map((id, i) => (i === pattern.length - 1 ? (id === "star" ? "moon" : "star") : id))
    : [...pattern];

  for (const [i, sym] of sequence.entries()) {
    await frame.locator(`.stamp-button[data-symbol="${sym}"]`).click({ delay: 60 });
    // Every stamp must land exactly once.
    await expect(frame.locator(".copy-slot.is-filled")).toHaveCount(i + 1);
  }

  await checkBtn.click({ delay: 60 });
  if (makeMistake) await expect(frame.locator(".session-message")).toHaveText(text.wrong);
}

const SECRET_TEXT = {
  ru: {
    progress: (n: number) => `Послание ${n} из 4`,
    check: "Проверить",
    wrong: "В послании есть ошибки. Проверь знаки и нажми ещё раз!",
  },
  en: {
    progress: (n: number) => `Message ${n} of 4`,
    check: "Check",
    wrong: "The message has mistakes. Check the signs and try again!",
  },
};
