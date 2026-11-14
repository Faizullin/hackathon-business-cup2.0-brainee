import type { GameDefinition } from "../kit";
import manifest from "./manifest.json" with { type: "json" };
export const oddOneOut: GameDefinition = {
  ...manifest,
  kind: "dev",
  runtime: "react",
  skills: manifest.skills as GameDefinition["skills"],
  load: () => import("./OddOneOut"),
};

export default oddOneOut;
