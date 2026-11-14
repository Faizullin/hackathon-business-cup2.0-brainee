// Small hand-rolled SVG charts (D-21): no chart dependency for the demo.
const COLORS = { coral: "var(--coral)", sky: "var(--sky)", mint: "var(--mint)", sun: "var(--sun)" };
export type ChartColor = keyof typeof COLORS;

export function Radar({
  labels,
  series,
  average,
  label,
}: {
  labels: string[];
  series: { values: number[]; color: ChartColor }[];
  average?: number[];
  label: string;
}) {
  const size = 320;
  const c = size / 2;
  const r = 105;
  const point = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)] as const;
  };
  const path = (values: number[]) =>
    values
      .map((v, i) =>
        point(i, v)
          .map((n) => n.toFixed(1))
          .join(","),
      )
      .join(" ");
  return (
    <svg
      viewBox={`-56 -6 ${size + 112} ${size + 12}`}
      role="img"
      aria-label={label}
      className="h-auto w-full max-w-[400px] self-center"
    >
      {[25, 50, 75, 100].map((ring) => (
        <polygon
          key={ring}
          points={path(labels.map(() => ring))}
          fill="none"
          stroke="var(--line)"
        />
      ))}
      {labels.map((text, i) => {
        const [x, y] = point(i, 100);
        const [lx, ly] = point(i, 128);
        return (
          <g key={text}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" />
            <text
              x={lx}
              y={ly}
              textAnchor={Math.abs(lx - c) < 8 ? "middle" : lx > c ? "start" : "end"}
              dominantBaseline="middle"
              fontSize="12"
              fill="var(--muted)"
            >
              {(text.length > 10 && text.includes(" ")
                ? [text.slice(0, text.indexOf(" ")), text.slice(text.indexOf(" ") + 1)]
                : [text]
              ).map((line, n, lines) => (
                <tspan key={line} x={lx} dy={n === 0 ? `${-(lines.length - 1) * 0.6}em` : "1.2em"}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
      {average && (
        <polygon
          points={path(average)}
          fill="none"
          stroke="var(--ink)"
          strokeDasharray="4 4"
          strokeWidth="1.5"
        />
      )}
      {series.map(({ values, color }, index) => (
        <polygon
          key={color}
          points={path(values)}
          fill={COLORS[color]}
          fillOpacity={index === series.length - 1 ? 0.22 : 0.1}
          stroke={COLORS[color]}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

export function Bars({
  categories,
  stacks,
  max,
  label,
  unit = "",
}: {
  categories: string[];
  stacks: { values: number[]; color: ChartColor }[];
  max: number;
  label: string;
  unit?: string;
}) {
  const w = 340;
  const h = 180;
  const pad = { l: 30, b: 22, t: 8 };
  const plot = h - pad.b - pad.t;
  const step = (w - pad.l) / categories.length;
  const bar = Math.min(28, step * 0.6);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="h-auto w-full">
      {[0, 0.5, 1].map((f) => {
        const y = pad.t + plot * (1 - f);
        return (
          <g key={f}>
            <line x1={pad.l} x2={w} y1={y} y2={y} stroke="var(--line)" />
            <text
              x={pad.l - 4}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="var(--muted)"
            >
              {Math.round(max * f)}
              {unit}
            </text>
          </g>
        );
      })}
      {categories.map((cat, i) => {
        let base = 0;
        const x = pad.l + step * i + (step - bar) / 2;
        return (
          <g key={cat}>
            {stacks.map(({ values, color }) => {
              const v = values[i] ?? 0;
              const height = (v / max) * plot;
              const y = pad.t + plot - ((base + v) / max) * plot;
              base += v;
              return v > 0 ? (
                <rect
                  key={color}
                  x={x}
                  y={y}
                  width={bar}
                  height={height}
                  rx="3"
                  fill={COLORS[color]}
                />
              ) : null;
            })}
            <text x={x + bar / 2} y={h - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {cat}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Legend({
  items,
}: {
  items: { label: string; color?: ChartColor; dashed?: boolean }[];
}) {
  return (
    <ul className="flex flex-wrap gap-3 text-muted-foreground text-xs">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-4 rounded-sm"
            style={
              item.dashed
                ? { border: "1.5px dashed var(--ink)" }
                : { background: item.color ? COLORS[item.color] : "var(--ink)" }
            }
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
