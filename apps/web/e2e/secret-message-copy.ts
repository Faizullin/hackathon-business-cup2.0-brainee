import type { FrameLocator } from "@playwright/test";

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
  if (typeof roundIndex === "number") {
    await frame
      .locator(".session-progress")
      .filter({ hasText: `Послание ${roundIndex + 1} из 4` })
      .waitFor({ state: "visible", timeout: 8000 });
  }

  // Wait until in recall phase (or click check to end preview early)
  const cover = frame.locator("#memory-cover");
  const checkBtn = frame.locator('[data-action="check"]');

  // If preview is still running, clicking check switches to recall early
  const isCovered = await cover.evaluate((el) => el.classList.contains("is-covered"));
  if (!isCovered) {
    await checkBtn.click();
    await frame
      .locator(".session-message")
      .filter({ hasText: "Восстанови секретное послание" })
      .waitFor({ state: "visible" });
  }

  await frame.locator('[data-action="clear"]').click({ delay: 60 });
  const sequence = makeMistake
    ? pattern.map((id, i) => (i === pattern.length - 1 ? (id === "star" ? "moon" : "star") : id))
    : [...pattern];

  for (const sym of sequence) {
    const stampBtn = frame.locator(`.stamp-button[data-symbol="${sym}"]`);
    await stampBtn.click({ delay: 60 });
    await new Promise((r) => setTimeout(r, 80));
  }

  // Click Check
  await checkBtn.click();
}
