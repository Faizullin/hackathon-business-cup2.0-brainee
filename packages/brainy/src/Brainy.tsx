import type { BrainyStats, Equipped } from "@brainee/core";
import { useId } from "react";
import { brainyModel, INK } from "./model";

type BrainyProps = {
  stats: BrainyStats;
  equipped?: Equipped;
  /** Localized accessible name (decorative by default); pass "" when a visible label already describes Brainy. */
  label?: string;
  className?: string;
  /** 0–1: how open the mouth is while Brainy talks (films). 0 keeps the stat-driven smile. */
  talk?: number;
};

// Head bumps: [x factor, y factor, radius factor] (prototype).
const BUMPS = [
  [-0.55, -0.55, 0.52],
  [0, -0.78, 0.52],
  [0.55, -0.55, 0.52],
  [-0.86, 0, 0.46],
  [0.86, 0, 0.46],
  [-0.5, 0.45, 0.5],
  [0.5, 0.45, 0.5],
] as const;
const SCREENS = [
  [-1, -0.9, -18],
  [1, -1.05, 14],
  [1.05, 0.3, -10],
] as const;
const SIDES = [-1, 1] as const;

export function Brainy({ stats, equipped = {}, label = "", className, talk = 0 }: BrainyProps) {
  const uid = useId().replace(/:/g, "");
  const m = brainyModel(stats, equipped);
  const { cx, cy, rx, ry, fill: F, dark: D } = m;
  const fold = {
    stroke: D,
    strokeWidth: 3,
    fill: "none",
    strokeLinecap: "round",
    opacity: 0.6,
  } as const;
  const er = m.eyes.r;
  const ey = m.eyes.y;
  const gr = er + 5;

  return (
    <svg
      viewBox="-12 -22 264 300"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={className}
      data-brainy=""
    >
      {SIDES.map((d) => {
        const x = cx + d * rx * 0.32;
        return (
          <g key={`leg${d}`}>
            <path
              d={`M${x} ${m.legs.y} L${x + d * 3} ${m.legs.y + m.legs.len}`}
              stroke={D}
              strokeWidth={m.legs.width}
              strokeLinecap="round"
            />
            <ellipse cx={x + d * 8} cy={m.legs.y + m.legs.len + 4} rx="14" ry="7" fill={INK} />
          </g>
        );
      })}

      {SIDES.map((d) => {
        const sy = m.arms.y;
        const sx = cx + d * rx * 0.9;
        const ex = cx + d * (rx + 20);
        const elbowY = sy + 20;
        const hx = cx + d * (rx + 30);
        const hy = sy + 34 - m.arms.lift;
        return (
          <g key={`arm${d}`}>
            <path
              d={`M${sx} ${sy} Q${ex} ${elbowY + 8} ${hx} ${hy}`}
              stroke={D}
              strokeWidth={m.arms.width}
              fill="none"
              strokeLinecap="round"
            />
            {m.flags.biceps && (
              <circle
                cx={ex - d * 2}
                cy={elbowY - 2}
                r={m.arms.bicepR}
                fill={D}
                data-part="bicep"
              />
            )}
            <circle cx={hx} cy={hy} r={m.arms.handR} fill={F} stroke={D} strokeWidth="3" />
          </g>
        );
      })}

      {m.flags.backpack && (
        <g data-part="backpack">
          <rect
            x={cx + rx * 0.55}
            y={cy - ry * 0.2}
            width={rx * 0.5}
            height={ry * 0.85}
            rx="10"
            fill="#3C68EE"
          />
          <rect
            x={cx + rx * 0.62}
            y={cy + ry * 0.15}
            width={rx * 0.34}
            height={ry * 0.25}
            rx="5"
            fill="#7A97FF"
          />
        </g>
      )}

      {BUMPS.map(([bx, by, br]) => (
        <circle key={`${bx}${by}`} cx={cx + bx * rx} cy={cy + by * ry} r={br * ry} fill={F} />
      ))}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={F} />
      <path
        d={`M${cx} ${cy - ry * 1.22} Q${cx - 7} ${cy - ry * 0.8} ${cx} ${cy - ry * 0.38}`}
        {...fold}
      />
      {SIDES.map((d) => (
        <g key={`fold${d}`}>
          <path
            d={`M${cx + d * rx * 0.22} ${cy - ry * 0.8} q${d * rx * 0.14} ${-ry * 0.16} ${d * rx * 0.28} 0 t${d * rx * 0.28} 0`}
            {...fold}
          />
          <path
            d={`M${cx + d * rx * 0.5} ${cy - ry * 0.38} q${d * rx * 0.12} ${-ry * 0.14} ${d * rx * 0.24} 0`}
            {...fold}
          />
        </g>
      ))}

      {m.eyes.xs.map((ex, i) => {
        const clip = `${uid}e${i}`;
        const d = i === 0 ? -1 : 1;
        return (
          <g key={clip}>
            <clipPath id={clip}>
              <circle cx={ex} cy={ey} r={er} />
            </clipPath>
            <g clipPath={`url(#${clip})`}>
              <circle cx={ex} cy={ey} r={er} fill="#fff" />
              <circle cx={ex + 2} cy={ey + 3} r={er * 0.45} fill={INK} />
              <circle cx={ex + 4} cy={ey} r={er * 0.14} fill="#fff" />
              <rect x={ex - er} y={ey - er} width={er * 2} height={m.eyes.lid} fill={F} />
            </g>
            {m.flags.lidLine && (
              <path
                d={`M${ex - er * 0.9} ${ey - er + m.eyes.lid} L${ex + er * 0.9} ${ey - er + m.eyes.lid}`}
                stroke={D}
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
            {m.flags.eyeCircles && (
              <path
                data-part="eye-circle"
                d={`M${ex - er * 0.7} ${ey + er + 4} q${er * 0.7} 6 ${er * 1.4} 0`}
                stroke="#6B5A88"
                strokeWidth="2.5"
                fill="none"
                opacity=".5"
              />
            )}
            {m.flags.blush && (
              <ellipse
                cx={ex + d * er * 0.4}
                cy={ey + er + 12}
                rx="8"
                ry="5"
                fill="#FF5E7E"
                opacity=".35"
              />
            )}
          </g>
        );
      })}

      {equipped.face === "glasses" && (
        <g data-acc="glasses">
          <g fill="rgba(190,225,255,.22)" stroke={INK} strokeWidth="4">
            {m.eyes.xs.map((x) => (
              <circle key={x} cx={x} cy={ey} r={gr} />
            ))}
          </g>
          <path
            d={`M${m.eyes.xs[0] + gr} ${ey} Q${cx} ${ey - 8} ${m.eyes.xs[1] - gr} ${ey}`}
            stroke={INK}
            strokeWidth="4"
            fill="none"
          />
        </g>
      )}

      {talk > 0 ? (
        <ellipse
          data-talk=""
          cx={cx}
          cy={m.mouth.y + 3}
          rx={m.mouth.w * (0.55 + talk * 0.15)}
          ry={2 + Math.min(talk, 1) * 11}
          fill={INK}
        />
      ) : (
        <path
          d={`M${cx - m.mouth.w} ${m.mouth.y} Q${cx} ${m.mouth.y + m.mouth.curve} ${cx + m.mouth.w} ${m.mouth.y}`}
          stroke={INK}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {equipped.neck === "bowtie" && (
        <g data-acc="bowtie">
          <path
            d={`M${cx} ${cy + ry * 0.93} l-20 -11 v22z M${cx} ${cy + ry * 0.93} l20 -11 v22z`}
            fill="#EE5A4A"
          />
          <circle cx={cx} cy={cy + ry * 0.93} r="6" fill="#C2402F" />
        </g>
      )}
      {equipped.neck === "scarf" && (
        <g data-acc="scarf">
          <rect
            x={cx - rx * 0.72}
            y={cy + ry * 0.78}
            width={rx * 1.44}
            height="15"
            rx="7"
            fill="#139E80"
          />
          <rect
            x={cx + rx * 0.25}
            y={cy + ry * 0.78 + 8}
            width="14"
            height="34"
            rx="5"
            fill="#0F7F67"
          />
          <path
            d={`M${cx - rx * 0.5} ${cy + ry * 0.78 + 2}v11M${cx - rx * 0.2} ${cy + ry * 0.78 + 2}v11M${cx + rx * 0.1} ${cy + ry * 0.78 + 2}v11`}
            stroke="#FFC845"
            strokeWidth="3"
          />
        </g>
      )}
      {equipped.head === "cowboy" && (
        <g data-acc="cowboy">
          <path
            d={`M${cx - rx * 0.48} ${cy - ry * 1.1} C${cx - rx * 0.52} ${cy - ry * 1.78} ${cx - rx * 0.15} ${cy - ry * 1.62} ${cx} ${cy - ry * 1.5} C${cx + rx * 0.15} ${cy - ry * 1.62} ${cx + rx * 0.52} ${cy - ry * 1.78} ${cx + rx * 0.48} ${cy - ry * 1.1}Z`}
            fill="#B5763D"
          />
          <rect
            x={cx - rx * 0.48}
            y={cy - ry * 1.24}
            width={rx * 0.96}
            height={ry * 0.12}
            fill="#5A3418"
          />
          <path
            d={`M${cx - rx * 1.08} ${cy - ry * 1.22} Q${cx} ${cy - ry * 0.82} ${cx + rx * 1.08} ${cy - ry * 1.22} Q${cx} ${cy - ry * 1.0} ${cx - rx * 1.08} ${cy - ry * 1.22}Z`}
            fill="#9A6233"
          />
        </g>
      )}
      {equipped.head === "cap" && (
        <g data-acc="cap">
          <path
            d={`M${cx - rx * 0.66} ${cy - ry} Q${cx} ${cy - ry * 1.8} ${cx + rx * 0.66} ${cy - ry}Z`}
            fill="#3C68EE"
          />
          <ellipse cx={cx + rx * 0.6} cy={cy - ry} rx={rx * 0.42} ry={ry * 0.09} fill="#2A4FC4" />
          <circle cx={cx} cy={cy - ry * 1.4} r="5" fill="#2A4FC4" />
        </g>
      )}
      {equipped.head === "phones" && (
        <g data-acc="phones">
          <path
            d={`M${cx - rx * 0.98} ${cy - ry * 0.1} Q${cx} ${cy - ry * 2.05} ${cx + rx * 0.98} ${cy - ry * 0.1}`}
            stroke={INK}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {SIDES.map((d) => (
            <rect
              key={d}
              x={cx + d * rx * 0.98 - 11}
              y={cy - ry * 0.3}
              width="22"
              height="34"
              rx="9"
              fill="#EE5A4A"
            />
          ))}
        </g>
      )}

      {m.flags.screens &&
        SCREENS.map(([sx, sy, rot]) => {
          const x = cx + sx * (rx + 18);
          const y = cy + sy * ry;
          return (
            <g key={rot} transform={`rotate(${rot} ${x} ${y})`} opacity=".8" data-part="screen">
              <rect
                x={x - 9}
                y={y - 15}
                width="18"
                height="30"
                rx="4"
                fill="#fff"
                stroke={D}
                strokeWidth="2"
              />
              <path d={`M${x - 3} ${y - 5} l7 5 -7 5z`} fill={D} />
            </g>
          );
        })}
      {m.flags.sleepyZ && (
        <text
          data-part="zz"
          x={cx + rx * 0.7}
          y={cy - ry * 1.1}
          fontFamily="var(--font-d), Arial"
          fontWeight="700"
          fontSize="18"
          fill="#6B5A88"
        >
          z z
        </text>
      )}
      {m.flags.brainStar && (
        <path
          data-part="star"
          d={`M${cx - rx * 1.05} ${cy - ry * 1.05} l4 9 9 4 -9 4 -4 9 -4-9 -9-4 9-4z`}
          fill="#FFC845"
        />
      )}
    </svg>
  );
}
