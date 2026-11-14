"use client";
import type { BrainyStats, Equipped } from "@brainee/core";
import { useRef } from "react";
import { Accessories } from "./Accessories";
import { type BrainyEffects, brainyModel, INK } from "./model";
import { useFrame } from "./use-frame";
export type BrainyProps = {
  stats: BrainyStats;
  equipped?: Equipped;
  label?: string;
  className?: string;
  mood?: number;
  animate?: boolean;
  effects?: BrainyEffects;
  earned?: readonly string[];
};
export function Brainy({
  stats,
  equipped = {},
  label = "",
  className,
  mood = 72,
  animate = false,
  effects = "kid",
  earned = [],
}: BrainyProps) {
  const ref = useRef<SVGSVGElement>(null);
  const t = useFrame(ref, animate);
  const m = brainyModel(stats, equipped, mood, t, effects, earned);
  return (
    <svg
      ref={ref}
      viewBox="-30 -40 280 268"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={className}
      data-brainy=""
      data-energy={m.energy}
      data-frame={t}
      data-effects={effects}
    >
      <g transform={`translate(110 219) scale(${m.scale}) translate(-110 -219)`}>
        {m.flags.garden && (
          <g data-part="garden" fill="#8C76FF">
            <path d="M16 214v-26m0 10q-16-20-15-3 1 10 15 3m0 7q18-20 17-4-2 8-17 4" />
            <circle cx="16" cy="184" r="7" fill="#FF9EC2" />
          </g>
        )}
        <ellipse cx="110" cy="219" rx={m.shadowRx} ry="5" fill="#1C1B33" opacity="0.1"></ellipse>

        <circle cx="110" cy={m.glowY} r={m.glowR} fill="#FFE066" opacity={m.glowOp}></circle>

        {effects === "full" && (
          <g fill="#A9BC55">
            <circle cx={m.z0.x} cy={m.z0.y} r={m.z0.r} opacity={m.z0.op}></circle>
            <circle cx={m.z1.x} cy={m.z1.y} r={m.z1.r} opacity={m.z1.op}></circle>
            <circle cx={m.z2.x} cy={m.z2.y} r={m.z2.r} opacity={m.z2.op}></circle>
            <circle cx={m.z3.x} cy={m.z3.y} r={m.z3.r} opacity={m.z3.op}></circle>
            <circle cx={m.z4.x} cy={m.z4.y} r={m.z4.r} opacity={m.z4.op}></circle>
            <circle cx={m.z5.x} cy={m.z5.y} r={m.z5.r} opacity={m.z5.op}></circle>
          </g>
        )}

        <g
          fill="none"
          stroke="#1C1B33"
          strokeWidth={m.limbWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={m.legL}></path>
          <path d={m.legR}></path>
          <path d={m.armL}></path>
          <path d={m.armR}></path>
        </g>
        <ellipse cx={m.shoeLx} cy={m.shoeLy} rx="11" ry="6.5" fill="#5A3FE0"></ellipse>
        <ellipse cx={m.shoeRx} cy={m.shoeRy} rx="11" ry="6.5" fill="#5A3FE0"></ellipse>
        <circle
          cx={m.handLx}
          cy={m.handLy}
          r={m.handRadius}
          fill="#FFFFFF"
          stroke="#1C1B33"
          strokeWidth="3"
        ></circle>
        <circle
          cx={m.handRx}
          cy={m.handRy}
          r={m.handRadius}
          fill="#FFFFFF"
          stroke="#1C1B33"
          strokeWidth="3"
        ></circle>

        {m.flags.cape && (
          <path
            data-part="cape"
            d="M50 110 Q15 170 30 204 Q105 184 164 204 L174 110Z"
            fill="#5A3FE0"
          />
        )}
        {m.flags.backpack && (
          <g data-part="backpack">
            <rect x="158" y="100" width="42" height="65" rx="10" fill="#2847C7" />
            <rect x="166" y="132" width="28" height="22" rx="6" fill="#8C76FF" />
          </g>
        )}
        <g transform={m.bodyTransform}>
          <g fill={m.shade}>
            <circle cx="70" cy="85" r={44 * m.lobeScale}></circle>
            <circle cx="110" cy="65" r={46 * m.lobeScale}></circle>
            <circle cx="150" cy="85" r={44 * m.lobeScale}></circle>
            <circle cx="62" cy="125" r={38 * m.lobeScale}></circle>
            <circle cx="110" cy="131" r={44 * m.lobeScale}></circle>
            <circle cx="158" cy="125" r={38 * m.lobeScale}></circle>
          </g>
          <g fill={m.fill}>
            <circle cx="70" cy="78" r={44 * m.lobeScale}></circle>
            <circle cx="110" cy="58" r={46 * m.lobeScale}></circle>
            <circle cx="150" cy="78" r={44 * m.lobeScale}></circle>
            <circle cx="62" cy="118" r={38 * m.lobeScale}></circle>
            <circle cx="110" cy="124" r={44 * m.lobeScale}></circle>
            <circle cx="158" cy="118" r={38 * m.lobeScale}></circle>
          </g>
          <g fill="none" stroke={m.fold} strokeWidth="5" strokeLinecap="round" opacity="0.6">
            <path d="M110 20 C104 44 116 64 110 86"></path>
            <path d="M44 82 Q60 64 80 76"></path>
            <path d="M140 70 Q158 58 176 76"></path>
            <path d="M44 124 Q60 140 80 128"></path>
            <path d="M140 130 Q158 142 176 124"></path>
            <path d="M78 44 Q92 34 98 50"></path>
            <path d="M124 48 Q134 34 148 44"></path>
          </g>
          {effects === "full" && (
            <g fill="#5F6B2E" opacity={m.rotOpacity}>
              <circle cx="66" cy="66" r="9"></circle>
              <circle cx="152" cy="62" r="7"></circle>
              <circle cx="164" cy="120" r="10"></circle>
              <circle cx="54" cy="132" r="6"></circle>
              <circle cx="132" cy="40" r="5"></circle>
              <circle cx="84" cy="152" r="7"></circle>
            </g>
          )}
          <g fill="#FF6F9F" opacity={m.cheekOpacity}>
            <ellipse cx="78" cy="122" rx="9" ry="5.5"></ellipse>
            <ellipse cx="142" cy="122" rx="9" ry="5.5"></ellipse>
          </g>
          <circle cx="92" cy="104" r={m.eyeRadius} fill="#1C1B33"></circle>
          <circle cx="128" cy="104" r={m.eyeRadius} fill="#1C1B33"></circle>
          <circle cx="94.5" cy="101.5" r="2.4" fill="#FFFFFF"></circle>
          <circle cx="130.5" cy="101.5" r="2.4" fill="#FFFFFF"></circle>
          <rect x="83" y="95.5" width="18" height={m.lid} fill={m.fill}></rect>
          <rect x="119" y="95.5" width="18" height={m.lid} fill={m.fill}></rect>
          <path
            d={m.mouth}
            fill="none"
            stroke="#1C1B33"
            strokeWidth="5"
            strokeLinecap="round"
          ></path>
          <Accessories equipped={equipped} />
          {m.flags.sleepyZ && (
            <text
              data-part="zz"
              x="165"
              y="12"
              fill="#5F6180"
              fontSize="14"
              fontFamily="var(--font-b)"
            >
              z z
            </text>
          )}
          {m.flags.badge && (
            <g data-part="badge">
              <circle cx="154" cy="153" r="12" fill="#FFAE1A" />
              <path d="m148 153 4 4 8-9" stroke={INK} strokeWidth="3" fill="none" />
            </g>
          )}
        </g>

        <g fill="#5A3FE0" opacity={m.sparkleOpacity}>
          <path d={m.star1}></path>
          <path d={m.star2}></path>
          <path d={m.star3}></path>
          <path d={m.star4}></path>
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={m.b0.d} stroke="#FFAE1A" strokeWidth="6" opacity={m.b0.op}></path>
          <path d={m.b0.d} stroke="#FFF6C8" strokeWidth="2.2" opacity={m.b0.op}></path>
          <path d={m.b1.d} stroke="#FFAE1A" strokeWidth="6" opacity={m.b1.op}></path>
          <path d={m.b1.d} stroke="#FFF6C8" strokeWidth="2.2" opacity={m.b1.op}></path>
          <path d={m.b2.d} stroke="#FFAE1A" strokeWidth="6" opacity={m.b2.op}></path>
          <path d={m.b2.d} stroke="#FFF6C8" strokeWidth="2.2" opacity={m.b2.op}></path>
          <path d={m.b3.d} stroke="#FFAE1A" strokeWidth="6" opacity={m.b3.op}></path>
          <path d={m.b3.d} stroke="#FFF6C8" strokeWidth="2.2" opacity={m.b3.op}></path>
          <path d={m.b4.d} stroke="#FFAE1A" strokeWidth="6" opacity={m.b4.op}></path>
          <path d={m.b4.d} stroke="#FFF6C8" strokeWidth="2.2" opacity={m.b4.op}></path>
          <path d={m.b5.d} stroke="#FFAE1A" strokeWidth="6" opacity={m.b5.op}></path>
          <path d={m.b5.d} stroke="#FFF6C8" strokeWidth="2.2" opacity={m.b5.op}></path>
          <path d={m.b6.d} stroke="#FFAE1A" strokeWidth="6" opacity={m.b6.op}></path>
          <path d={m.b6.d} stroke="#FFF6C8" strokeWidth="2.2" opacity={m.b6.op}></path>
        </g>
        <g fill="#FFFFFF" stroke="#FFAE1A" strokeWidth="2">
          <circle cx={m.b0.ex} cy={m.b0.ey} r={m.b0.r} opacity={m.b0.op}></circle>
          <circle cx={m.b1.ex} cy={m.b1.ey} r={m.b1.r} opacity={m.b1.op}></circle>
          <circle cx={m.b2.ex} cy={m.b2.ey} r={m.b2.r} opacity={m.b2.op}></circle>
          <circle cx={m.b3.ex} cy={m.b3.ey} r={m.b3.r} opacity={m.b3.op}></circle>
          <circle cx={m.b4.ex} cy={m.b4.ey} r={m.b4.r} opacity={m.b4.op}></circle>
          <circle cx={m.b5.ex} cy={m.b5.ey} r={m.b5.r} opacity={m.b5.op}></circle>
          <circle cx={m.b6.ex} cy={m.b6.ey} r={m.b6.r} opacity={m.b6.op}></circle>
        </g>

        <path d={m.sweat} fill="#6FA8FF" opacity={m.sweatOpacity}></path>

        {effects === "full" && (
          <>
            <g fill="none" strokeWidth="4" strokeLinecap="round">
              <path d={m.w0.d} stroke={m.w0.c} opacity={m.w0.op}></path>
              <path d={m.w1.d} stroke={m.w1.c} opacity={m.w1.op}></path>
              <path d={m.w2.d} stroke={m.w2.c} opacity={m.w2.op}></path>
              <path d={m.w3.d} stroke={m.w3.c} opacity={m.w3.op}></path>
              <path d={m.w4.d} stroke={m.w4.c} opacity={m.w4.op}></path>
              <path d={m.w5.d} stroke={m.w5.c} opacity={m.w5.op}></path>
              <path d={m.w6.d} stroke={m.w6.c} opacity={m.w6.op}></path>
            </g>

            <g fill="#9BB04A">
              <circle cx={m.p0.x} cy={m.p0.y} r={m.p0.r} opacity={m.p0.op}></circle>
              <circle cx={m.p1.x} cy={m.p1.y} r={m.p1.r} opacity={m.p1.op}></circle>
              <circle cx={m.p2.x} cy={m.p2.y} r={m.p2.r} opacity={m.p2.op}></circle>
              <circle cx={m.p3.x} cy={m.p3.y} r={m.p3.r} opacity={m.p3.op}></circle>
              <circle cx={m.p4.x} cy={m.p4.y} r={m.p4.r} opacity={m.p4.op}></circle>
            </g>

            <g opacity={m.f0.op}>
              <ellipse
                cx={m.f0.wlx}
                cy={m.f0.wy}
                rx="4"
                ry={m.f0.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <ellipse
                cx={m.f0.wrx}
                cy={m.f0.wy}
                rx="4"
                ry={m.f0.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <circle cx={m.f0.x} cy={m.f0.y} r="3.5" fill="#1C1B33"></circle>
            </g>
            <g opacity={m.f1.op}>
              <ellipse
                cx={m.f1.wlx}
                cy={m.f1.wy}
                rx="4"
                ry={m.f1.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <ellipse
                cx={m.f1.wrx}
                cy={m.f1.wy}
                rx="4"
                ry={m.f1.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <circle cx={m.f1.x} cy={m.f1.y} r="3.5" fill="#1C1B33"></circle>
            </g>
            <g opacity={m.f2.op}>
              <ellipse
                cx={m.f2.wlx}
                cy={m.f2.wy}
                rx="4"
                ry={m.f2.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <ellipse
                cx={m.f2.wrx}
                cy={m.f2.wy}
                rx="4"
                ry={m.f2.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <circle cx={m.f2.x} cy={m.f2.y} r="3.5" fill="#1C1B33"></circle>
            </g>
            <g opacity={m.f3.op}>
              <ellipse
                cx={m.f3.wlx}
                cy={m.f3.wy}
                rx="4"
                ry={m.f3.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <ellipse
                cx={m.f3.wrx}
                cy={m.f3.wy}
                rx="4"
                ry={m.f3.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <circle cx={m.f3.x} cy={m.f3.y} r="3.5" fill="#1C1B33"></circle>
            </g>
            <g opacity={m.f4.op}>
              <ellipse
                cx={m.f4.wlx}
                cy={m.f4.wy}
                rx="4"
                ry={m.f4.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <ellipse
                cx={m.f4.wrx}
                cy={m.f4.wy}
                rx="4"
                ry={m.f4.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <circle cx={m.f4.x} cy={m.f4.y} r="3.5" fill="#1C1B33"></circle>
            </g>
            <g opacity={m.f5.op}>
              <ellipse
                cx={m.f5.wlx}
                cy={m.f5.wy}
                rx="4"
                ry={m.f5.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <ellipse
                cx={m.f5.wrx}
                cy={m.f5.wy}
                rx="4"
                ry={m.f5.flap}
                fill="#FFFFFF"
                stroke="#1C1B33"
                strokeWidth="1.5"
              ></ellipse>
              <circle cx={m.f5.x} cy={m.f5.y} r="3.5" fill="#1C1B33"></circle>
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
