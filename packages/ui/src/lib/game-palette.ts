/** Light reference colors for canvas engines. CSS consumers use --game-* aliases.
 * pnpm check:palette verifies these against the shared UI tokens.
 */
export const GAME_PALETTE = {
  surface: "#F2F1FA",
  tile: "#FFFFFF",
  tileRing: "#E6E4F2",
  selected: "#5A3FE0",
  selectedWash: "#ECE8FF",
  correct: "#2847C7",
  correctWash: "#E3E9FF",
  retry: "#9A3B12",
  retryWash: "#FDE6D8",
  star: "#FFAE1A",
  highlight: "#FF9EC2",
  shapes: ["#5A3FE0", "#FF6F9F", "#FFAE1A", "#2847C7", "#F0A27E", "#1C1B33"],
} as const;
