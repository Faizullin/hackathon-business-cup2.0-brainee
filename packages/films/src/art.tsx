// Film art: the only backgrounds (`bg`) and props a script may name (docs/dev/films.md).
// Flat inline SVG in the platform palette; no images, fonts or links. Backgrounds use a
// 160×90 viewBox, props 100×100. `style` places a prop on the 16:9 stage in %; props with a
// `base` stand on the background's `ground` line instead (layout.ts).
import type { CSSProperties, ReactNode } from "react";
import type { FilmMotion } from "./motion";

export const PALETTE = {
  coral: "#EE5A4A",
  sun: "#F2AE12",
  orange: "#E5731A",
  mint: "#139E80",
  sky: "#3C68EE",
  pink: "#FF8FA3",
  ink: "#2B2350",
  white: "#FFFFFF",
} as const;
const P = PALETTE;

export type FilmBackground = {
  label: string;
  svg: ReactNode;
  /** Ground line in % of stage height (grass, floor, table). Sky-like scenes have none. */
  ground?: number;
};
export type FilmProp = {
  label: string;
  cls: FilmMotion;
  /** `top` is used only when the prop floats; grounded props are placed on the ground line. */
  style: Pick<CSSProperties, "left" | "top" | "width">;
  /** Things that stand on the ground: viewBox y (0–100) of the point that touches it. */
  base?: number;
  /** With `base`: may also appear where there is no ground (a rocket in space) and float there. */
  floats?: boolean;
  svg: ReactNode;
};

const at = (left: number, top: number, width: number) => ({
  left: `${left}%`,
  top: `${top}%`,
  width: `${width}%`,
});

/** Vertical wash from `top` to `bottom` colour; ids are per background. */
const wash = (id: string, top: string, bottom: string, topOpacity = 1) => (
  <>
    <defs>
      <linearGradient id={`film-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} stopOpacity={topOpacity} />
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
    </defs>
    <rect width="160" height="90" fill={`url(#film-${id})`} />
  </>
);
const daySky = (id: string) => wash(id, P.sky, "#DCE6FF");

export const FILM_BG: Record<string, FilmBackground> = {
  yard: {
    label: "Yard with grass under a blue sky",
    ground: 78,
    svg: (
      <>
        {daySky("yard")}
        <path d="M0 62 Q40 52 80 60 T160 56 V90 H0Z" fill={P.mint} />
        <path d="M0 72 Q50 64 100 72 T160 70 V90 H0Z" fill="#0F8A6F" />
        {[12, 34, 58, 96, 122, 146].map((x) => (
          <path key={x} d={`M${x} 80 l2 -6 l2 6 l2 -5 l2 5`} stroke="#0B6B56" fill="none" />
        ))}
      </>
    ),
  },
  sky: {
    label: "Open blue sky",
    svg: (
      <>
        {daySky("sky")}
        <ellipse cx="30" cy="70" rx="40" ry="8" fill={P.white} opacity=".45" />
        <ellipse cx="128" cy="78" rx="46" ry="9" fill={P.white} opacity=".45" />
      </>
    ),
  },
  sea: {
    label: "Blue sea under the sky",
    svg: (
      <>
        {daySky("sea")}
        <rect y="54" width="160" height="36" fill={P.sky} />
        {[60, 68, 76, 84].map((y, i) => (
          <path
            key={y}
            d={`M${i % 2 ? -8 : 0} ${y} q8 -3 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0`}
            stroke={P.white}
            strokeOpacity=".5"
            fill="none"
          />
        ))}
      </>
    ),
  },
  desert: {
    label: "Hot sandy desert",
    ground: 78,
    svg: (
      <>
        {daySky("desert")}
        <path d="M0 60 Q40 46 80 60 T160 54 V90 H0Z" fill={P.sun} />
        <path d="M0 74 Q60 60 110 74 T160 72 V90 H0Z" fill={P.orange} opacity=".8" />
      </>
    ),
  },
  mountains: {
    label: "Tall snowy mountains",
    ground: 94,
    svg: (
      <>
        {daySky("mountains")}
        <path d="M-10 90 L40 30 L90 90Z" fill="#5E6BA8" />
        <path d="M60 90 L110 22 L170 90Z" fill="#4A5694" />
        <path d="M40 30 L30 42 L38 40 L44 45 L50 42Z" fill={P.white} />
        <path d="M110 22 L98 38 L107 35 L114 41 L121 37Z" fill={P.white} />
        <rect y="82" width="160" height="8" fill={P.mint} />
      </>
    ),
  },
  room: {
    label: "Room with a sunny window",
    ground: 82,
    svg: (
      <>
        <rect width="160" height="90" fill="#FFF3DC" />
        <rect y="66" width="160" height="24" fill="#E9C99A" />
        <rect x="16" y="6" width="36" height="30" rx="2" fill={P.sky} opacity=".55" />
        <path d="M34 6v30M16 21h36" stroke={P.white} strokeWidth="3" />
        <rect
          x="16"
          y="6"
          width="36"
          height="30"
          rx="2"
          fill="none"
          stroke={P.white}
          strokeWidth="3"
        />
        <path d="M16 36 H52 L104 90 H64Z" fill={P.sun} opacity=".3" />
      </>
    ),
  },
  sunbeam: {
    label: "Inside a golden sunbeam",
    svg: (
      <>
        {wash("sunbeam", P.sun, "#FFF6D6")}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M${-20 + i * 34} 90 L${10 + i * 34} 0 H${22 + i * 34} L${-8 + i * 34} 90Z`}
            fill={P.white}
            opacity=".28"
          />
        ))}
      </>
    ),
  },
  space: {
    label: "Black space with stars",
    svg: (
      <>
        <rect width="160" height="90" fill="#141033" />
        {[
          [12, 10],
          [40, 24],
          [70, 8],
          [96, 30],
          [130, 14],
          [150, 40],
          [22, 52],
          [58, 70],
          [118, 66],
          [84, 84],
          [140, 82],
          [6, 80],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r=".9" fill={P.white} />
        ))}
      </>
    ),
  },
  sunset: {
    label: "Evening sky at sunset",
    ground: 84,
    svg: (
      <>
        <defs>
          <linearGradient id="film-sunset" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6B3FA0" />
            <stop offset=".45" stopColor={P.pink} />
            <stop offset=".8" stopColor={P.orange} />
            <stop offset="1" stopColor={P.sun} />
          </linearGradient>
        </defs>
        <rect width="160" height="90" fill="url(#film-sunset)" />
        <circle cx="80" cy="74" r="14" fill={P.sun} />
        <path d="M0 72 Q50 64 100 72 T160 70 V90 H0Z" fill="#3A2A5C" />
      </>
    ),
  },
  kitchen: {
    label: "Dark kitchen for the experiment",
    ground: 67,
    svg: (
      <>
        <rect width="160" height="90" fill="#2A2546" />
        <rect y="60" width="160" height="30" fill="#3B3360" />
        <rect y="58" width="160" height="4" fill="#4C437A" />
        <rect
          x="14"
          y="10"
          width="34"
          height="26"
          rx="2"
          fill="#1C1838"
          stroke="#4C437A"
          strokeWidth="3"
        />
        <path d="M31 10v26M14 23h34" stroke="#4C437A" strokeWidth="3" />
      </>
    ),
  },
  rainy: {
    label: "Grey rainy yard",
    ground: 80,
    svg: (
      <>
        {wash("rainy", "#7C86A8", "#C9CFE0")}
        <path d="M0 64 Q40 56 80 62 T160 60 V90 H0Z" fill="#3E8E78" />
        <path d="M0 76 Q50 70 100 76 T160 74 V90 H0Z" fill="#2F7A66" />
        {[8, 26, 44, 62, 80, 98, 116, 134, 152].map((x, i) => (
          <path
            key={x}
            d={`M${x} ${4 + (i % 3) * 14} l-3 9`}
            stroke={P.white}
            strokeOpacity=".7"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        ))}
      </>
    ),
  },
  cloudland: {
    label: "Inside a cloud",
    svg: (
      <>
        {wash("cloudland", "#DCE6FF", P.white)}
        {[
          [20, 20, 26],
          [80, 12, 34],
          [140, 26, 28],
          [40, 70, 34],
          [118, 76, 38],
        ].map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={P.white} opacity=".75" />
        ))}
        {[
          [30, 44],
          [64, 36],
          [100, 50],
          [132, 40],
          [76, 62],
          [14, 58],
        ].map(([cx, cy]) => (
          <circle key={`d${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill={P.sky} opacity=".55" />
        ))}
      </>
    ),
  },
  night: {
    label: "Night sky over quiet hills",
    ground: 80,
    svg: (
      <>
        {wash("night", "#141033", "#3A3470")}
        {[
          [14, 10],
          [46, 18],
          [78, 6],
          [104, 22],
          [132, 12],
          [152, 30],
          [30, 34],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r=".9" fill={P.white} />
        ))}
        <path d="M0 66 Q40 54 80 64 T160 58 V90 H0Z" fill="#26205A" />
        <path d="M0 78 Q60 68 110 78 T160 76 V90 H0Z" fill="#1C1846" />
      </>
    ),
  },
  bedroom: {
    label: "Bedroom at night",
    ground: 82,
    svg: (
      <>
        <rect width="160" height="90" fill="#2E2A5A" />
        <rect y="66" width="160" height="24" fill="#3F3972" />
        <rect x="16" y="8" width="36" height="30" rx="2" fill="#141033" />
        <circle cx="26" cy="16" r=".9" fill={P.white} />
        <circle cx="44" cy="26" r=".9" fill={P.white} />
        <path d="M34 8v30M16 23h36" stroke="#5B5492" strokeWidth="3" />
        <rect
          x="16"
          y="8"
          width="36"
          height="30"
          rx="2"
          fill="none"
          stroke="#5B5492"
          strokeWidth="3"
        />
      </>
    ),
  },
  morning: {
    label: "Morning sunrise over hills",
    ground: 80,
    svg: (
      <>
        <defs>
          <linearGradient id="film-morning" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9DB4F7" />
            <stop offset=".6" stopColor="#FFD9C2" />
            <stop offset="1" stopColor="#FFE9A8" />
          </linearGradient>
        </defs>
        <rect width="160" height="90" fill="url(#film-morning)" />
        <circle cx="122" cy="66" r="12" fill={P.sun} />
        <path d="M0 66 Q40 56 80 64 T160 62 V90 H0Z" fill={P.mint} />
        <path d="M0 78 Q50 70 100 78 T160 76 V90 H0Z" fill="#0F8A6F" />
      </>
    ),
  },
};

const bubble = (
  <>
    <path
      d="M50 6 C76 6 94 22 94 44 C94 66 76 80 52 80 L36 94 L38 78 C18 72 6 60 6 44 C6 22 24 6 50 6Z"
      fill={P.coral}
    />
    <path
      d="M38 34 C38 24 46 20 51 20 C60 20 64 26 64 32 C64 42 52 42 52 52"
      stroke={P.white}
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="52" cy="65" r="5" fill={P.white} />
  </>
);

const rays = Array.from({ length: 12 }, (_, i) => i * 30);
const ball = (cx: number, cy: number, fill: string) => (
  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" fill={fill} stroke={P.ink} strokeOpacity=".2" />
);

export const FILM_PROPS: Record<string, FilmProp> = {
  question: { label: "Question bubble", cls: "pop", style: at(43, 3, 14), svg: bubble },
  sun: {
    label: "Sun",
    cls: "spin",
    style: at(78, 4, 15),
    svg: (
      <>
        {rays.map((deg) => (
          <rect
            key={deg}
            x="47"
            y="2"
            width="6"
            height="16"
            rx="3"
            fill={P.sun}
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="27" fill={P.sun} />
        <circle cx="50" cy="50" r="20" fill="#FFD25C" />
      </>
    ),
  },
  cloud: {
    label: "Cloud",
    cls: "drift",
    style: at(6, 6, 22),
    svg: (
      <path
        d="M22 70 C8 70 4 54 16 48 C14 34 30 28 40 36 C44 22 66 20 72 36 C86 32 96 46 88 56 C96 64 90 72 80 72Z"
        fill={P.white}
      />
    ),
  },
  sunbeam: {
    label: "Sunbeam",
    cls: "twinkle",
    style: at(30, 0, 30),
    svg: (
      <>
        <path d="M70 0 L100 0 L34 100 L10 100Z" fill={P.sun} opacity=".75" />
        <path d="M80 0 L92 0 L28 100 L18 100Z" fill="#FFE59A" />
      </>
    ),
  },
  rainbow: {
    label: "Rainbow",
    cls: "bob",
    style: at(27, 2, 46),
    svg: (
      <>
        {[P.coral, P.orange, P.sun, P.mint, P.sky, "#7B4FD0"].map((color, i) => (
          <path
            key={color}
            d={`M${8 + i * 6} 80 A${42 - i * 6} ${42 - i * 6} 0 0 1 ${92 - i * 6} 80`}
            stroke={color}
            strokeWidth="6"
            fill="none"
          />
        ))}
      </>
    ),
  },
  mirror: {
    label: "Hand mirror",
    cls: "sway",
    style: at(64, 8, 14),
    svg: (
      <>
        <rect x="44" y="62" width="12" height="34" rx="5" fill={P.orange} />
        <ellipse cx="50" cy="38" rx="30" ry="34" fill={P.orange} />
        <ellipse cx="50" cy="38" rx="23" ry="27" fill="#BFD2FF" />
        <path
          d="M36 26 L48 18 M36 38 L56 22"
          stroke={P.white}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </>
    ),
  },
  brush: {
    label: "Giant paintbrush",
    cls: "sway",
    style: at(64, 6, 15),
    svg: (
      <>
        <rect x="44" y="4" width="12" height="56" rx="5" fill={P.coral} />
        <rect x="40" y="56" width="20" height="12" rx="2" fill="#B8B8C8" />
        <path d="M40 68 H60 C62 80 56 92 50 96 C44 92 38 80 40 68Z" fill={P.sky} />
      </>
    ),
  },
  waves: {
    label: "Sea waves",
    cls: "swim",
    style: at(58, 48, 32),
    svg: (
      <>
        {[40, 58, 76].map((y) => (
          <path
            key={y}
            d={`M2 ${y} q12 -12 24 0 t24 0 t24 0 t24 0`}
            stroke={P.sky}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </>
    ),
  },
  crayons: {
    label: "Open crayon box",
    cls: "still",
    style: at(62, 18, 20),
    base: 92,
    svg: (
      <>
        {[P.coral, P.orange, P.sun, P.mint, P.sky, "#7B4FD0"].map((color, i) => (
          <path key={color} d={`M${18 + i * 11} 50 V20 l4 -10 l4 10 V50Z`} fill={color} />
        ))}
        <rect x="10" y="44" width="80" height="48" rx="6" fill={P.mint} />
        <rect x="22" y="58" width="56" height="20" rx="4" fill={P.white} opacity=".85" />
      </>
    ),
  },
  colors: {
    label: "Colour dots of sunlight",
    cls: "twinkle",
    style: at(34, 4, 24),
    svg: (
      <>
        {[P.coral, P.orange, P.sun, P.mint, P.sky, "#7B4FD0"].map((color, i) => (
          <circle
            key={color}
            cx={50 + 32 * Math.cos((i * Math.PI) / 3)}
            cy={50 + 32 * Math.sin((i * Math.PI) / 3)}
            r="12"
            fill={color}
          />
        ))}
        <circle cx="50" cy="50" r="14" fill={P.white} />
      </>
    ),
  },
  earth: {
    label: "Earth wrapped in air",
    cls: "spin",
    style: at(60, 6, 22),
    svg: (
      <>
        <circle cx="50" cy="50" r="46" fill="#BFD2FF" opacity=".5" />
        <circle cx="50" cy="50" r="36" fill={P.sky} />
        <path d="M28 34 C36 26 46 30 44 40 C42 48 30 50 26 44Z" fill={P.mint} />
        <path d="M56 56 C64 50 76 56 72 66 C68 74 56 74 54 66Z" fill={P.mint} />
        <path d="M54 22 C62 20 70 26 66 32 C60 34 54 30 54 22Z" fill={P.mint} />
        <path
          d="M24 60 q10 -4 18 2 M60 38 q10 -4 16 2"
          stroke={P.white}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  air: {
    label: "Tiny bits of air",
    cls: "drift",
    style: at(30, 3, 26),
    svg: (
      <>
        {[
          [14, 20],
          [34, 12],
          [56, 22],
          [80, 14],
          [22, 44],
          [46, 40],
          [70, 46],
          [88, 36],
          [12, 70],
          [36, 64],
          [60, 72],
          [84, 66],
          [28, 88],
          [52, 90],
          [76, 86],
        ].map(([x, y], i) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={i % 3 ? 3.5 : 5} fill={P.sky} opacity=".7" />
        ))}
      </>
    ),
  },
  wind: {
    label: "Wind swirls",
    cls: "drift",
    style: at(8, 12, 28),
    svg: (
      <>
        <path
          d="M6 34 H62 C76 34 78 16 66 14 C58 13 56 22 60 26"
          stroke={P.white}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M14 54 H78 C92 54 94 74 82 76 C74 77 72 68 76 64"
          stroke={P.white}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M4 74 H44" stroke={P.white} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  tree: {
    label: "Tree",
    cls: "sway",
    style: at(70, 12, 22),
    base: 98,
    svg: (
      <>
        <rect x="44" y="56" width="12" height="42" rx="4" fill="#8A5A2B" />
        <circle cx="50" cy="38" r="30" fill={P.mint} />
        <circle cx="30" cy="52" r="18" fill="#0F8A6F" />
        <circle cx="70" cy="52" r="18" fill="#0F8A6F" />
      </>
    ),
  },
  hand: {
    label: "Open hand",
    cls: "sway",
    style: at(66, 12, 14),
    svg: (
      <path
        d="M30 96 C24 80 20 64 22 52 C23 46 30 46 32 52 L34 60 V20 C34 13 44 13 44 20 V48 V12 C44 5 54 5 54 12 V48 V16 C54 9 64 9 64 16 V50 V26 C64 19 74 19 74 26 V64 C74 80 68 92 62 96Z"
        fill="#F6C39A"
        stroke={P.orange}
        strokeWidth="3"
      />
    ),
  },
  bubbles: {
    label: "Bath bubbles",
    cls: "rise",
    style: at(64, 8, 20),
    svg: (
      <>
        {[
          [30, 70, 18],
          [62, 62, 14],
          [46, 34, 12],
          [76, 30, 9],
          [24, 30, 8],
          [56, 86, 9],
        ].map(([cx, cy, r]) => (
          <g key={`${cx}-${cy}`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="#DCE6FF"
              fillOpacity=".5"
              stroke={P.sky}
              strokeWidth="2"
            />
            <circle
              cx={(cx ?? 0) - (r ?? 0) * 0.35}
              cy={(cy ?? 0) - (r ?? 0) * 0.35}
              r={(r ?? 0) * 0.22}
              fill={P.white}
            />
          </g>
        ))}
      </>
    ),
  },
  bounce: {
    label: "Blue light bouncing off air",
    cls: "buzz",
    style: at(33, 3, 26),
    svg: (
      <>
        <path
          d="M4 80 L26 30 L48 72 L70 22 L94 60"
          stroke={P.sky}
          strokeWidth="6"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M4 90 L96 90" stroke={P.coral} strokeWidth="5" strokeLinecap="round" />
        <path d="M4 96 L96 96" stroke={P.sun} strokeWidth="5" strokeLinecap="round" />
        {[
          [26, 30],
          [48, 72],
          [70, 22],
        ].map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="6"
            fill={P.white}
            stroke={P.sky}
            strokeWidth="3"
          />
        ))}
      </>
    ),
  },
  marbles: {
    label: "Rolling marbles",
    cls: "still",
    style: at(62, 40, 22),
    base: 93,
    svg: (
      <>
        {ball(10, 86, P.sky)}
        {ball(28, 78, P.mint)}
        {ball(46, 88, P.coral)}
        {ball(62, 80, P.sun)}
        {ball(78, 87, "#7B4FD0")}
        {ball(92, 79, P.sky)}
      </>
    ),
  },
  eye: {
    label: "Eye",
    cls: "twinkle",
    style: at(66, 10, 16),
    svg: (
      <>
        <path
          d="M4 50 C24 18 76 18 96 50 C76 82 24 82 4 50Z"
          fill={P.white}
          stroke={P.ink}
          strokeWidth="4"
        />
        <circle cx="50" cy="50" r="20" fill={P.sky} />
        <circle cx="50" cy="50" r="9" fill={P.ink} />
        <circle cx="56" cy="44" r="4" fill={P.white} />
      </>
    ),
  },
  stars: {
    label: "Twinkling stars",
    cls: "twinkle",
    style: at(6, 3, 24),
    svg: (
      <>
        {[
          [20, 24, 1],
          [70, 16, 0.7],
          [48, 62, 0.9],
          [86, 70, 0.6],
        ].map(([x, y, s]) => (
          <path
            key={`${x}-${y}`}
            transform={`translate(${x} ${y}) scale(${s})`}
            d="M0 -16 L4 -4 L16 0 L4 4 L0 16 L-4 4 L-16 0 L-4 -4Z"
            fill={P.sun}
          />
        ))}
      </>
    ),
  },
  star: {
    label: "Big praise star",
    cls: "pop",
    style: at(68, 6, 14),
    svg: (
      <path
        d="M50 4 L62 36 L96 37 L69 58 L79 92 L50 72 L21 92 L31 58 L4 37 L38 36Z"
        fill={P.sun}
        stroke={P.orange}
        strokeWidth="4"
        strokeLinejoin="round"
      />
    ),
  },
  basket: {
    label: "Basket of coloured balls",
    cls: "still",
    style: at(62, 20, 20),
    base: 90,
    svg: (
      <>
        {ball(30, 40, P.coral)}
        {ball(48, 34, P.orange)}
        {ball(66, 40, P.coral)}
        {ball(40, 26, P.orange)}
        <path d="M14 46 H86 L78 90 H22Z" fill="#C98A3A" />
        <path d="M18 60 H82 M20 74 H80" stroke="#8A5A2B" strokeWidth="3" />
        <path d="M24 46 C24 10 76 10 76 46" stroke="#8A5A2B" strokeWidth="5" fill="none" />
      </>
    ),
  },
  bench: {
    label: "Park bench",
    cls: "still",
    style: at(60, 34, 28),
    base: 94,
    svg: (
      <>
        <rect x="8" y="40" width="84" height="10" rx="3" fill="#8A5A2B" />
        <rect x="8" y="56" width="84" height="10" rx="3" fill="#A86E35" />
        <rect x="14" y="66" width="6" height="28" fill={P.ink} />
        <rect x="80" y="66" width="6" height="28" fill={P.ink} />
      </>
    ),
  },
  glass: {
    label: "Glass of milky water",
    cls: "still",
    style: at(66, 14, 14),
    base: 94,
    svg: (
      <>
        <path
          d="M22 10 H78 L70 94 H30Z"
          fill="#DCE6FF"
          fillOpacity=".35"
          stroke={P.white}
          strokeWidth="3"
        />
        <path d="M25 34 H75 L70 94 H30Z" fill="#A9BFF8" fillOpacity=".85" />
        <path
          d="M32 40 L36 86"
          stroke={P.white}
          strokeWidth="4"
          strokeLinecap="round"
          opacity=".7"
        />
      </>
    ),
  },
  flashlight: {
    label: "Flashlight with a beam",
    cls: "still",
    style: at(42, 14, 22),
    base: 60,
    svg: (
      <>
        <path d="M60 40 L100 22 V78 L60 60Z" fill="#FFE59A" opacity=".85" />
        <rect x="4" y="40" width="44" height="20" rx="5" fill={P.sky} />
        <path d="M46 36 H60 V64 H46Z" fill={P.ink} />
        <rect x="14" y="45" width="8" height="10" rx="2" fill={P.white} />
      </>
    ),
  },
  milk: {
    label: "Milk bottle",
    cls: "still",
    style: at(84, 18, 9),
    base: 98,
    svg: (
      <>
        <rect x="38" y="4" width="24" height="12" rx="3" fill={P.sky} />
        <path
          d="M38 16 H62 V28 L76 44 V92 C76 96 72 98 68 98 H32 C28 98 24 96 24 92 V44 L38 28Z"
          fill={P.white}
          stroke="#BFD2FF"
          strokeWidth="3"
        />
        <rect x="30" y="56" width="40" height="18" rx="3" fill={P.sky} opacity=".8" />
      </>
    ),
  },
  puddle: {
    label: "Puddle",
    cls: "still",
    style: at(56, 50, 30),
    base: 70,
    svg: (
      <>
        <ellipse cx="50" cy="76" rx="46" ry="14" fill={P.sky} opacity=".75" />
        <ellipse cx="50" cy="74" rx="30" ry="7" fill="#9DB4F7" />
        <path
          d="M30 72 q6 -3 12 0"
          stroke={P.white}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  raincloud: {
    label: "Grey rain cloud with falling drops",
    cls: "drift",
    style: at(30, 2, 28),
    svg: (
      <>
        <path
          d="M22 56 C8 56 4 40 16 34 C14 20 30 14 40 22 C44 8 66 6 72 22 C86 18 96 32 88 42 C96 50 90 58 80 58Z"
          fill="#535C7E"
        />
        {[24, 40, 56, 72].map((x, i) => (
          <path key={x} d={`M${x} ${66 + (i % 2) * 8} q-4 8 0 12 q4 -4 0 -12Z`} fill={P.sky} />
        ))}
      </>
    ),
  },
  drop: {
    label: "Shiny water drop",
    cls: "bob",
    style: at(64, 8, 14),
    svg: (
      <>
        <path
          d="M50 6 C66 34 80 52 80 68 C80 86 66 96 50 96 C34 96 20 86 20 68 C20 52 34 34 50 6Z"
          fill={P.sky}
        />
        <path
          d="M36 66 C36 56 42 48 46 44"
          stroke={P.white}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  boots: {
    label: "Rain boots",
    cls: "still",
    style: at(36, 22, 18),
    base: 90,
    svg: (
      <>
        <path d="M14 20 H40 V70 H52 C60 70 62 86 54 86 H14Z" fill={P.coral} />
        <path d="M54 20 H80 V70 H92 C100 70 100 86 94 86 H54Z" fill={P.sun} />
        <rect x="12" y="84" width="44" height="6" rx="3" fill={P.ink} />
        <rect x="52" y="84" width="44" height="6" rx="3" fill={P.ink} />
      </>
    ),
  },
  wateringcan: {
    label: "Giant watering can",
    cls: "sway",
    style: at(62, 8, 22),
    svg: (
      <>
        <path d="M16 40 H66 V86 C66 90 62 92 58 92 H24 C20 92 16 90 16 86Z" fill={P.mint} />
        <path d="M66 50 L94 26 L98 32 L70 64Z" fill={P.mint} />
        <path d="M24 40 C24 18 58 18 58 40" stroke="#0F8A6F" strokeWidth="6" fill="none" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={96 - i * 3} cy={42 + i * 10} r="3" fill={P.sky} />
        ))}
      </>
    ),
  },
  clothesline: {
    label: "Clothes drying on a line",
    cls: "still",
    style: at(58, 10, 30),
    base: 98,
    svg: (
      <>
        <rect x="0" y="16" width="4" height="82" rx="2" fill="#8A5A2B" />
        <rect x="96" y="16" width="4" height="82" rx="2" fill="#8A5A2B" />
        <path d="M2 20 Q50 34 98 20" stroke={P.ink} strokeWidth="2" fill="none" />
        <path d="M14 24 H38 V30 H34 V60 H18 V30 H14Z" fill={P.coral} />
        <path d="M46 28 H70 L66 62 H50Z" fill={P.sky} />
        <path d="M76 24 H92 V52 H76Z" fill={P.sun} />
      </>
    ),
  },
  bird: {
    label: "Bird",
    cls: "fly",
    style: at(10, 14, 16),
    svg: (
      <>
        <ellipse cx="48" cy="56" rx="26" ry="18" fill={P.sky} />
        <circle cx="72" cy="44" r="12" fill={P.sky} />
        <path d="M82 44 L94 48 L82 52Z" fill={P.sun} />
        <circle cx="75" cy="41" r="3" fill={P.ink} />
        <path d="M36 50 C30 26 50 22 56 46Z" fill="#2B4FC4" />
        <path d="M24 58 L6 50 L14 64Z" fill="#2B4FC4" />
      </>
    ),
  },
  house: {
    label: "House with a roof",
    cls: "still",
    style: at(64, 14, 24),
    base: 92,
    svg: (
      <>
        <path d="M8 46 L50 10 L92 46Z" fill={P.coral} />
        <rect x="18" y="44" width="64" height="48" fill="#FFF3DC" />
        <rect x="28" y="56" width="16" height="14" fill={P.sky} opacity=".7" />
        <rect x="56" y="62" width="16" height="30" fill={P.orange} />
      </>
    ),
  },
  jar: {
    label: "Jar with a plate and ice cubes",
    cls: "still",
    style: at(64, 12, 18),
    base: 96,
    svg: (
      <>
        <rect x="26" y="24" width="48" height="8" rx="3" fill="#C9CFE0" />
        <rect x="34" y="12" width="12" height="12" rx="2" fill="#DCE6FF" stroke={P.sky} />
        <rect x="52" y="14" width="12" height="10" rx="2" fill="#DCE6FF" stroke={P.sky} />
        <path
          d="M28 32 H72 V88 C72 92 68 96 64 96 H36 C32 96 28 92 28 88Z"
          fill="#DCE6FF"
          fillOpacity=".35"
          stroke={P.white}
          strokeWidth="3"
        />
        <path
          d="M30 70 H70 V88 C70 92 66 94 62 94 H38 C34 94 30 92 30 88Z"
          fill={P.sky}
          opacity=".6"
        />
        {[38, 50, 62].map((x) => (
          <circle key={x} cx={x} cy="38" r="2.5" fill={P.sky} />
        ))}
      </>
    ),
  },
  river: {
    label: "River flowing to the sea",
    cls: "still",
    style: at(56, 46, 34),
    base: 66,
    svg: (
      <>
        <path
          d="M0 70 C20 54 40 82 60 66 S90 56 100 64 V86 C90 78 70 92 50 84 S16 76 0 90Z"
          fill={P.sky}
        />
        <path
          d="M14 76 q8 -4 16 0 M54 74 q8 -4 16 0"
          stroke={P.white}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  carousel: {
    label: "Merry-go-round",
    cls: "still",
    style: at(62, 10, 24),
    base: 90,
    svg: (
      <>
        <path d="M10 34 L50 8 L90 34Z" fill={P.coral} />
        <path d="M10 34 H90 V40 H10Z" fill={P.sun} />
        {[24, 50, 76].map((x) => (
          <rect key={x} x={x - 2} y="40" width="4" height="40" fill={P.ink} />
        ))}
        <circle cx="24" cy="62" r="8" fill={P.mint} />
        <circle cx="76" cy="58" r="8" fill={P.pink} />
        <rect x="6" y="80" width="88" height="10" rx="4" fill={P.orange} />
      </>
    ),
  },
  juice: {
    label: "Cold glass of juice with drops",
    cls: "still",
    style: at(66, 14, 14),
    base: 94,
    svg: (
      <>
        <path
          d="M22 10 H78 L70 94 H30Z"
          fill="#DCE6FF"
          fillOpacity=".35"
          stroke={P.white}
          strokeWidth="3"
        />
        <path d="M25 30 H75 L70 94 H30Z" fill={P.orange} />
        {[
          [30, 44],
          [62, 56],
          [40, 74],
          [68, 34],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill={P.white} opacity=".85" />
        ))}
      </>
    ),
  },
  flower: {
    label: "Flower drinking rain",
    cls: "sway",
    style: at(85, 20, 13),
    base: 96,
    svg: (
      <>
        <path d="M50 50 V96" stroke={P.mint} strokeWidth="6" />
        <path d="M50 76 C36 70 30 60 34 56 C44 58 50 66 50 76Z" fill={P.mint} />
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="50"
            cy="24"
            rx="10"
            ry="16"
            fill={P.pink}
            transform={`rotate(${deg} 50 38)`}
          />
        ))}
        <circle cx="50" cy="38" r="10" fill={P.sun} />
      </>
    ),
  },
  rocket: {
    label: "Cardboard box rocket",
    cls: "bob",
    style: at(62, 6, 20),
    base: 100,
    floats: true,
    svg: (
      <>
        <path d="M50 2 C66 16 72 34 72 52 H28 C28 34 34 16 50 2Z" fill={P.coral} />
        <rect x="28" y="50" width="44" height="34" fill="#C98A3A" />
        <circle cx="50" cy="34" r="9" fill="#9DB4F7" stroke={P.white} strokeWidth="3" />
        <circle cx="40" cy="62" r="3" fill={P.sun} />
        <circle cx="52" cy="62" r="3" fill={P.mint} />
        <path d="M28 66 L12 86 H28Z M72 66 L88 86 H72Z" fill={P.coral} />
        <path d="M38 84 L50 100 L62 84Z" fill={P.sun} />
      </>
    ),
  },
  moon: {
    label: "Crescent moon",
    cls: "twinkle",
    style: at(74, 4, 14),
    svg: (
      <path
        d="M60 8 C34 12 18 34 22 58 C26 82 52 96 76 88 C50 84 34 62 38 40 C40 26 48 14 60 8Z"
        fill="#FFE59A"
      />
    ),
  },
  bed: {
    label: "Cozy bed with a pillow",
    cls: "still",
    style: at(60, 26, 28),
    base: 90,
    svg: (
      <>
        <rect x="6" y="34" width="10" height="56" rx="3" fill="#8A5A2B" />
        <rect x="84" y="50" width="10" height="40" rx="3" fill="#8A5A2B" />
        <rect x="10" y="56" width="80" height="22" rx="4" fill={P.sky} />
        <ellipse cx="28" cy="52" rx="14" ry="8" fill={P.white} />
        <path d="M40 56 H90 V66 H40Z" fill={P.pink} />
      </>
    ),
  },
  lamp: {
    label: "Living-room lamp",
    cls: "still",
    style: at(66, 10, 16),
    base: 94,
    svg: (
      <>
        <circle cx="50" cy="30" r="26" fill={P.sun} opacity=".3" />
        <path d="M30 10 H70 L80 40 H20Z" fill={P.sun} />
        <rect x="47" y="40" width="6" height="46" fill={P.ink} />
        <rect x="32" y="86" width="36" height="8" rx="3" fill={P.ink} />
      </>
    ),
  },
  ball: {
    label: "Beach ball with a tiny ant",
    cls: "spin",
    style: at(62, 10, 22),
    base: 94,
    floats: true,
    svg: (
      <>
        <circle cx="50" cy="54" r="40" fill={P.white} />
        <path d="M50 14 C30 30 30 78 50 94 C36 78 36 30 50 14Z" fill={P.coral} />
        <path d="M50 14 C70 30 70 78 50 94 C64 78 64 30 50 14Z" fill={P.sky} />
        <path d="M12 44 C30 52 70 52 88 44 C70 58 30 58 12 44Z" fill={P.sun} />
        <circle
          cx="50"
          cy="54"
          r="40"
          fill="none"
          stroke={P.ink}
          strokeOpacity=".2"
          strokeWidth="2"
        />
        <circle cx="47" cy="12" r="3" fill={P.ink} />
        <circle cx="53" cy="12" r="3.5" fill={P.ink} />
      </>
    ),
  },
  top: {
    label: "Spinning top",
    cls: "buzz",
    style: at(64, 14, 18),
    base: 94,
    svg: (
      <>
        <rect x="46" y="4" width="8" height="20" rx="3" fill={P.ink} />
        <path d="M10 40 C10 26 90 26 90 40 L50 94Z" fill={P.coral} />
        <path d="M16 44 H84 L74 56 H26Z" fill={P.sun} />
        <path d="M30 62 H70 L62 72 H38Z" fill={P.mint} />
      </>
    ),
  },
  orange: {
    label: "Orange with a sticker",
    cls: "spin",
    style: at(66, 16, 16),
    base: 92,
    svg: (
      <>
        <circle cx="50" cy="54" r="38" fill={P.orange} />
        <path d="M50 16 C54 8 62 6 66 8 C62 14 56 16 50 16Z" fill={P.mint} />
        <path
          d="M30 44 L34 54 L44 54 L36 60 L39 70 L30 64 L21 70 L24 60 L16 54 L26 54Z"
          fill={P.white}
          stroke={P.ink}
          strokeWidth="1.5"
        />
      </>
    ),
  },
  cookie: {
    label: "Cookie shared in halves",
    cls: "bob",
    style: at(64, 18, 20),
    svg: (
      <>
        <path d="M46 14 A36 36 0 0 0 46 86Z" fill="#D9A15A" />
        <path d="M54 14 A36 36 0 0 1 54 86Z" fill="#D9A15A" />
        {[
          [30, 34],
          [36, 64],
          [24, 52],
          [68, 30],
          [74, 58],
          [64, 74],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#6B3F1A" />
        ))}
      </>
    ),
  },
  car: {
    label: "Car on a smooth road",
    cls: "drift",
    style: at(58, 30, 26),
    base: 88,
    svg: (
      <>
        <path
          d="M10 60 C10 50 18 46 26 46 L36 30 H66 L78 46 C88 46 92 52 92 60 V70 H10Z"
          fill={P.sky}
        />
        <path d="M40 34 H52 V46 H32Z M56 34 H64 L72 46 H56Z" fill="#DCE6FF" />
        <circle cx="30" cy="72" r="9" fill={P.ink} />
        <circle cx="74" cy="72" r="9" fill={P.ink} />
        <rect x="2" y="84" width="96" height="4" rx="2" fill="#5E6BA8" />
      </>
    ),
  },
  daynight: {
    label: "Earth with a day side and a night side",
    cls: "bob",
    style: at(52, 6, 24),
    svg: (
      <>
        <circle cx="50" cy="50" r="40" fill={P.sky} />
        <path
          d="M30 32 C38 24 48 28 46 38 C44 46 32 48 28 42Z M56 56 C64 50 76 56 72 66 C68 74 56 74 54 66Z"
          fill={P.mint}
        />
        <path d="M50 10 A40 40 0 0 1 50 90Z" fill="#141033" opacity=".7" />
        <circle cx="72" cy="30" r="1.5" fill={P.white} />
        <circle cx="80" cy="60" r="1.5" fill={P.white} />
      </>
    ),
  },
};
