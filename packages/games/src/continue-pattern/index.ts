import type { GameDefinition } from "../kit";
import manifest from "./manifest.json" with { type: "json" };
export const continuePattern: GameDefinition = {
  ...manifest,
  kind: "dev",
  runtime: "react",
  skills: manifest.skills as GameDefinition["skills"],
  load: () => import("./ContinuePattern"),
};

export default continuePattern;
