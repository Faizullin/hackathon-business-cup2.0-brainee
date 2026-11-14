import type { GameDefinition } from "../kit";

export const continuePattern: GameDefinition = {
  id: "continue-pattern",
  kind: "dev",
  title: "Продолжи узор",
  skills: { main: "logic", secondary: "attention" },
  weights: { logic: 0.7, attention: 0.3 },
  minAge: 5,
  levels: 2,
  runtime: "react",
  load: () => import("./ContinuePattern"),
};
