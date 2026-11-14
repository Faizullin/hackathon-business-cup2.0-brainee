import { startStandaloneGame } from "@brainee/engine-phaser";
import { PICTURE_PUZZLE_CONTRACT, type PicturePuzzleContract } from "./contract";
import { PuzzleScene } from "./scenes/PuzzleScene";

startStandaloneGame<PicturePuzzleContract>(
  "picture-puzzle",
  {
    // The canvas follows the window: the store plays games full-window.
    scaleMode: "resize",
    backgroundColor: "#f3ede2",
    scenes: [PuzzleScene],
  },
  { contract: PICTURE_PUZZLE_CONTRACT },
);
