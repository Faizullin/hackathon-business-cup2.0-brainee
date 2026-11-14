import type { ReactNode } from "react";
import type { ShapeSpec } from "./rounds";

const FILL: Record<ShapeSpec["color"], string> = {
  coral: "var(--coral)",
  sky: "var(--sky)",
  sun: "var(--sun)",
  mint: "var(--mint)",
};

// Port of the prototype's shape(): a 100×100 viewBox centred on (50, 50).
export function Shape({ spec }: { spec: ShapeSpec }) {
  const fill = FILL[spec.color];
  const k = spec.scale;
  let inner: ReactNode;
  if (spec.shape === "circle") inner = <circle cx="50" cy="50" r={40 * k} fill={fill} />;
  else if (spec.shape === "square") {
    const w = 76 * k;
    inner = <rect x={50 - w / 2} y={50 - w / 2} width={w} height={w} rx="12" fill={fill} />;
  } else {
    const h = 40 * k;
    inner = (
      <polygon
        points={`50,${50 - h} ${50 + h},${50 + h * 0.8} ${50 - h},${50 + h * 0.8}`}
        fill={fill}
      />
    );
  }
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full">
      {inner}
    </svg>
  );
}
