import { expect, test } from "vitest";
import { manifests, previewSchema, previews } from "./index";

test("exploration stays outside the learning catalog and rejects learning reward fields", () => {
  for (const preview of previews) {
    expect(manifests.some((game) => game.id === preview.id)).toBe(false);
    expect(
      previewSchema.safeParse({ ...preview, roundsPerSession: 4, weights: { logic: 1 } }).success,
    ).toBe(false);
    expect(
      previewSchema.safeParse({ ...preview, entry: "https://example.com/game.html" }).success,
    ).toBe(false);
  }
});
