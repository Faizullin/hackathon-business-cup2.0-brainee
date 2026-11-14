import { expect, type Page } from "@playwright/test";

type Point = { x: number; y: number };
type Scene = {
  round: {
    split: { inTray: number[] };
    pieces: (Point & { visible: boolean })[];
    level: { columns: number };
  };
  currentLayout: { board: Point; cellWidth: number; cellHeight: number };
  selectedPieceIndex: number | null;
  sessionRounds: number;
  sessionMistakes: number;
  nextLevelBtn: Point | null;
};

export async function puzzleScene(page: Page) {
  const iframe = page.getByTestId("embedded-game");
  await expect(iframe).toHaveAttribute("data-ready", "true", { timeout: 10000 });
  const frame = await iframe.contentFrame();
  return { iframe, frame };
}

// Read the ported Phaser scene's layout; perform real pointer input, never invoke game methods.
export async function placePuzzlePiece(page: Page, wrong = false) {
  const { iframe, frame } = await puzzleScene(page);
  const canvas = frame.locator("canvas");
  await expect(canvas).toBeVisible();
  await canvas.scrollIntoViewIfNeeded();
  const info = await canvas.evaluate(() => {
    const game = (
      window as unknown as { __PHASER_GAME__: { scene: { getScene(name: string): Scene } } }
    ).__PHASER_GAME__;
    const scene = game.scene.getScene("PuzzleScene");
    const index = scene.round.split.inTray.find((i) => scene.round.pieces[i]?.visible);
    if (index === undefined) return { next: scene.nextLevelBtn };
    const piece = scene.round.pieces[index];
    if (!piece) throw new Error("Missing puzzle piece");
    const { board, cellWidth, cellHeight } = scene.currentLayout;
    const column = index % scene.round.level.columns;
    const row = Math.floor(index / scene.round.level.columns);
    return {
      index,
      rounds: scene.sessionRounds,
      mistakes: scene.sessionMistakes,
      piece: { x: piece.x, y: piece.y },
      target: { x: board.x + (column + 0.5) * cellWidth, y: board.y + (row + 0.5) * cellHeight },
      wrong: {
        x: board.x + (((column + 1) % scene.round.level.columns) + 0.5) * cellWidth,
        y: board.y + (row + 0.5) * cellHeight,
      },
    };
  });
  if (info.next) {
    await canvas.click({ position: info.next, delay: 60 });
    return placePuzzlePiece(page, wrong);
  }
  if (!info.piece || !info.target || !info.wrong) throw new Error("No playable puzzle piece");
  // A real press spans frames; instantaneous down/up can be missed by WebKit/Phaser in the scrolled lab.
  await canvas.click({ position: info.piece, delay: 60 });
  await expect
    .poll(() =>
      canvas.evaluate(
        () =>
          (
            window as unknown as { __PHASER_GAME__: { scene: { getScene(name: string): Scene } } }
          ).__PHASER_GAME__.scene.getScene("PuzzleScene").selectedPieceIndex,
      ),
    )
    .toBe(info.index);
  await canvas.click({ position: wrong ? info.wrong : info.target, delay: 60 });
  if (wrong) {
    await expect
      .poll(() =>
        canvas.evaluate(
          () =>
            (
              window as unknown as { __PHASER_GAME__: { scene: { getScene(name: string): Scene } } }
            ).__PHASER_GAME__.scene.getScene("PuzzleScene").sessionMistakes,
        ),
      )
      .toBe((info.mistakes ?? 0) + 1);
  } else if ((info.rounds ?? 0) < 3) {
    await expect
      .poll(() =>
        canvas.evaluate(
          () =>
            (
              window as unknown as { __PHASER_GAME__: { scene: { getScene(name: string): Scene } } }
            ).__PHASER_GAME__.scene.getScene("PuzzleScene").sessionRounds,
        ),
      )
      .toBe((info.rounds ?? 0) + 1);
  }
  // Wait for the scene's short return/snap tween before selecting the next piece.
  if (await iframe.count()) await page.waitForTimeout(300);
}
