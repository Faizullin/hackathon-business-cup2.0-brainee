import type { GameObjects, Scene } from "phaser";
// The plugin's source, so it binds to the bundled Phaser (its .min.js expects a global).
import CutJigsawImage from "phaser4-rex-plugins/plugins/cutjigsawimage.js";
import type { EdgeLayout, PieceEdges } from "./edges.ts";
import { type PathPen, tracePiece } from "./shape.ts";

export interface CutOptions {
  columns: number;
  rows: number;
  edges: EdgeLayout;
  edgeWidth: number;
  edgeHeight: number;
}

/**
 * Cuts a loaded picture into jigsaw pieces with rex `cutjigsawimage`, using our
 * edge layout and piece shape so the board's outlines match exactly. Returns
 * the pieces in the cutter's order (row by row), not yet positioned.
 */
export function cutPicture(
  scene: Scene,
  textureKey: string,
  options: CutOptions,
): GameObjects.Image[] {
  const source = scene.add.image(0, 0, textureKey).setOrigin(0).setVisible(false);
  const pieces = (CutJigsawImage as unknown as CutJigsaw)(source, {
    piecesKey: `${textureKey}:pieces:${options.columns}x${options.rows}`,
    columns: options.columns,
    rows: options.rows,
    edgeWidth: options.edgeWidth,
    edgeHeight: options.edgeHeight,
    edges: options.edges,
    drawShapeCallback: (pen, width, height, edgeWidth, edgeHeight, edgeMode) => {
      tracePiece(pen, width, height, edgeWidth, edgeHeight, edgeMode);
      // A Phaser Graphics fills here; the canvas cutter clips to the path.
      pen.fillPath?.();
    },
    add: true,
    align: false,
  });
  source.destroy();
  return pieces;
}

type CutJigsaw = (
  source: GameObjects.Image,
  config: {
    piecesKey: string;
    columns: number;
    rows: number;
    edgeWidth: number;
    edgeHeight: number;
    edges: EdgeLayout;
    drawShapeCallback: (
      pen: PathPen & { fillPath?: () => unknown },
      width: number,
      height: number,
      edgeWidth: number,
      edgeHeight: number,
      edgeMode: PieceEdges,
    ) => void;
    add: boolean;
    align: boolean;
  },
) => GameObjects.Image[];
