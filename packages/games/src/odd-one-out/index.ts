import type { GameDefinition } from "../kit";

export const oddOneOut: GameDefinition = {
  id: "odd-one-out",
  kind: "dev",
  title: "Найди лишний",
  skills: { main: "attention" },
  levels: 2,
  runtime: "react",
  load: () => import("./OddOneOut"),
};
