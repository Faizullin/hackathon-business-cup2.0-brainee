// Film art: the only backgrounds (`bg`) and props a script may name (docs/dev/films.md).
// Flat inline SVG in the platform palette; no images, fonts or links. Backgrounds use a
// 160×90 viewBox, props 100×100. `style` places a prop on the 16:9 stage in %.
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

export type FilmBackground = { label: string; svg: ReactNode };
export type FilmProp = {
  label: string;
  cls: FilmMotion;
  style: Pick<CSSProperties, "left" | "top" | "width">;
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
    svg: (
      <>
        <rect width="160" height="90" fill="#2A2546" />
        <rect y="60" width="160" height="30" fill="#3B3360" />
        <rect y="58" width="160" height="4" fill="#4C437A" />
        <rect x="14" y="10" width="34" height="26" rx="2" fill="#1C1838" />
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
    cls: "bob",
    style: at(62, 18, 20),
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
    cls: "bob",
    style: at(62, 40, 22),
    svg: (
      <>
        {ball(20, 70, P.sky)}
        {ball(42, 56, P.mint)}
        {ball(66, 74, P.coral)}
        {ball(84, 48, P.sun)}
        {ball(34, 86, "#7B4FD0")}
        {ball(56, 36, P.sky)}
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
    cls: "bob",
    style: at(62, 20, 20),
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
    cls: "bob",
    style: at(60, 34, 28),
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
    cls: "bob",
    style: at(66, 14, 14),
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
    cls: "sway",
    style: at(42, 14, 22),
    svg: (
      <>
        <path d="M60 40 L100 22 V78 L60 60Z" fill={P.sun} opacity=".45" />
        <rect x="4" y="40" width="44" height="20" rx="5" fill={P.sky} />
        <path d="M46 36 H60 V64 H46Z" fill={P.ink} />
        <rect x="14" y="45" width="8" height="10" rx="2" fill={P.white} />
      </>
    ),
  },
  milk: {
    label: "Milk bottle",
    cls: "bob",
    style: at(84, 18, 9),
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
};
