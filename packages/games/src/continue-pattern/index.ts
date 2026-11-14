import type { GameDefinition } from "../kit";

export const continuePattern: GameDefinition = {
  id: "continue-pattern",
  kind: "dev",
  title: "Продолжи узор",
  skills: { main: "logic", secondary: "attention" },
  levels: 2,
  runtime: "react",
  load: () => import("./ContinuePattern"),
};
