// Pure port of Brain.dc.html, with mood, stage and body-stat inputs (D-36).
import { type BrainyStats, type Equipped, stageOf } from "@brainee/core";

function at<T>(items: readonly T[], index: number): T {
  const value = items[index];
  if (value === undefined) throw new RangeError("Missing reference geometry.");
  return value;
}
export const INK = "#1C1B33";
const clamp = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0);
export const runAmount = (h: number) => Math.max(0, Math.min(1, (h - 40) / 35));
export function mixColor(a: string, b: string, t: number) {
  const k = Math.max(0, Math.min(1, t));
  return `#${[1, 3, 5]
    .map((i) =>
      Math.round(
        Number.parseInt(a.slice(i, i + 2), 16) * (1 - k) +
          Number.parseInt(b.slice(i, i + 2), 16) * k,
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
export function palette(h: number) {
  const low = ["#BDB97E", "#8E8A52", "#6B6838"];
  const mid = ["#F2B8A8", "#D88E7C", "#B06A5A"];
  const high = ["#FF9EC2", "#E9719F", "#C24E7E"];
  if (h >= 70) return high;
  return (h >= 40 ? mid : low).map((v, i) =>
    mixColor(v, (h >= 40 ? high[i] : mid[i]) ?? v, h >= 40 ? (h - 40) / 30 : h / 40),
  );
}
function star(cx: number, cy: number, r: number) {
  const q = r * 0.28;
  return `M${cx} ${cy - r} L${cx + q} ${cy - q} L${cx + r} ${cy} L${cx + q} ${cy + q} L${cx} ${cy + r} L${cx - q} ${cy + q} L${cx - r} ${cy} L${cx - q} ${cy - q} Z`;
}
export type BrainyEffects = "kid" | "full";
export function brainyModel(
  stats: BrainyStats,
  equipped: Equipped = {},
  mood = 72,
  t = 0,
  effects: BrainyEffects = "kid",
  earned: readonly string[] = [],
  talk = 0,
) {
  const mouthWidth = 11 + clamp(stats.mouth) * 0.06;
  const voice = clamp(talk * 100) / 100;
  const h = clamp(mood);
  const swing = Math.sin(t * 2 * Math.PI * (0.5 + 1.7 * runAmount(h)));
  const c01 = (v: number) => Math.max(0, Math.min(1, v));
  const f = (n: number) => n.toFixed(1);

  const run = runAmount(h);
  const droop = c01((50 - h) / 50);
  const pal = palette(effects === "kid" ? Math.max(40, h) : h);

  const bob = run * Math.abs(swing) * 6 + (1 - run) * Math.sin(t * 1.8) * 1.2;
  const bodyY = -bob + droop * 6;
  const sx = 1 + droop * 0.03;
  const sy = 1 - droop * 0.05;

  const rad = Math.PI / 180;
  const theta0 = 6 + 34 * c01(h / 75);
  const bend0 = 15 + 75 * run;
  const shoulderY = 114 + bodyY + droop * 6;
  const arm = (side: number, x0: number, theta: number, bend: number) => {
    const d = (a: number): [number, number] => [side * Math.sin(a * rad), Math.cos(a * rad)];
    const d1 = d(theta);
    const d2 = d(theta + bend);
    const ex = x0 + d1[0] * 30;
    const ey = shoulderY + d1[1] * 30;
    const hx = ex + d2[0] * 28;
    const hy = ey + d2[1] * 28;
    return {
      path: `M${f(x0)} ${f(shoulderY)} Q${f(ex)} ${f(ey)} ${f(hx)} ${f(hy)}`,
      hx: hx,
      hy: hy,
    };
  };
  const aL = arm(-1, 34, theta0 + 10 * run * swing, bend0 + 25 * run * swing);
  const aR = arm(1, 186, theta0 - 10 * run * swing, bend0 - 25 * run * swing);

  const hipY = 158 + bodyY;
  const leg = (side: number, hx: number, fx: number, lift: number) => {
    const fy = 198 + clamp(stats.legs) * 0.14 - lift;
    const off = 3 + lift * 0.8 - droop * 7;
    const kx = (hx + fx) / 2 + side * off;
    const ky = (hipY + fy) / 2;
    return {
      path: `M${f(hx)} ${f(hipY)} Q${f(kx)} ${f(ky)} ${f(fx)} ${f(fy)}`,
      sx: fx + side * 5,
      sy: fy + 1,
    };
  };
  const lL = leg(-1, 92, 86, Math.max(0, swing) * 16 * run * (0.6 + clamp(stats.legs) / 250));
  const lR = leg(1, 128, 134, Math.max(0, -swing) * 16 * run * (0.6 + clamp(stats.legs) / 250));

  const smile = c01((h - 20) / 60) * 0.55 + (clamp(stats.mouth) / 100) * 0.45;
  const endY = 124 + 9 * (1 - smile);
  const ctrlY = endY + 14 * (2 * smile - 1);

  const blink = h >= 35 && t > 0 && t % 3.4 < 0.14;
  // The first growth stage reads as sleepy even at full energy, so the stage name matches the face.
  const sleepy = stats.eyes < 35 || stageOf(stats).id === "sleepy";
  const lid = blink ? 17 : Math.max(c01((60 - h) / 55) * 9, sleepy ? 7 : 0);

  const sweatK = (t * 0.9) % 1;
  const swx = 182;
  const swy = 46 + sweatK * 26 + bodyY;

  const stink = effects === "full" ? c01((50 - h) / 45) : 0;
  const dense = effects === "full" ? c01((25 - h) / 20) : 0;

  const wispBase = [
    [44, 30],
    [172, 30],
    [108, 10],
    [74, 20],
    [146, 20],
    [22, 80],
    [196, 80],
  ] as const;
  const wisps = wispBase.map((b, i) => {
    const k = (t * 0.42 + i * 0.37) % 1;
    const weight = c01(stink * 8 - i);
    const x = b[0] + Math.sin(t * 1.6 + i * 1.3) * 4;
    const y = b[1] - k * 56 + bodyY;
    const a = 5 + k * 7;
    return {
      d:
        "M" +
        f(x) +
        " " +
        f(y) +
        " C" +
        f(x + a) +
        " " +
        f(y - 6) +
        " " +
        f(x - a) +
        " " +
        f(y - 12) +
        " " +
        f(x) +
        " " +
        f(y - 18) +
        " C" +
        f(x + a) +
        " " +
        f(y - 24) +
        " " +
        f(x - a) +
        " " +
        f(y - 30) +
        " " +
        f(x) +
        " " +
        f(y - 34),
      c: i % 2 ? "#7E9230" : "#9BB04A",
      op: (Math.sin(k * Math.PI) * weight * (0.55 + 0.4 * stink)).toFixed(2),
    };
  });

  const hazeBase = [
    [60, 60, 40],
    [160, 55, 42],
    [110, 14, 36],
    [36, 132, 34],
    [184, 132, 36],
    [110, 176, 40],
  ] as const;
  const haze = hazeBase.map((b, i) => ({
    x: b[0],
    y: f(b[1] + bodyY),
    r: f(b[2] * (1 + 0.08 * Math.sin(t * 1.3 + i))),
    op: (dense * 0.18 + stink * 0.05).toFixed(3),
  }));

  const puffX = [30, 190, 110, 70, 150];
  const puffs = puffX.map((x0, i) => {
    const k = (t * 0.25 + i * 0.2) % 1;
    return {
      x: f(x0 + Math.sin(t + i) * 6),
      y: f(60 - k * 84 + bodyY),
      r: f(6 + k * 14),
      op: (Math.sin(k * Math.PI) * dense * 0.4).toFixed(2),
    };
  });

  const flyCount = effects === "full" && h < 45 ? 1 + Math.round(c01((40 - h) / 30) * 5) : 0;
  const orbits = [
    [110, 60, 92, 30, 2.2, 0],
    [110, 30, 70, 24, -2.8, 1.5],
    [110, 110, 112, 42, 1.7, 3],
    [60, 18, 30, 18, 3.6, 0.7],
    [165, 140, 42, 28, -3.1, 2.2],
    [120, -14, 54, 14, 2.6, 4],
  ] as const;
  const flies = orbits.map((o, i) => {
    const a = t * o[4] + o[5];
    const x = o[0] + o[2] * Math.cos(a) + Math.sin(t * 13 + i) * 2;
    const y = o[1] + o[3] * Math.sin(a) + Math.cos(t * 11 + i) * 2 + bodyY;
    return {
      x: f(x),
      y: f(y),
      wlx: f(x - 3.5),
      wrx: f(x + 3.5),
      wy: f(y - 4),
      flap: Math.sin(t * 40 + i * 2) > 0 ? 4 : 2.5,
      op: i < flyCount ? 1 : 0,
    };
  });

  const electric = c01((h - 75) / 15);
  const boltCount = stageOf(stats).id === "genius" && h >= 75 ? Math.round(2 + electric * 5) : 0;
  const rnd = (a: number, b: number, c: number) => {
    const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };
  const boltBase = [
    [56, 30, -130],
    [164, 30, -50],
    [110, 8, -90],
    [20, 86, -170],
    [200, 86, -10],
    [26, 150, 155],
    [194, 150, 25],
  ] as const;
  let flashing = 0;
  const bolts = boltBase.map((b, i) => {
    const period = 0.9 + i * 0.23;
    const local = t + i * 0.61;
    const n = Math.floor(local / period);
    const k = local - n * period;
    if (i >= boltCount || k >= 0.18) return { d: "M0 0", op: 0, ex: 0, ey: 0, r: 0 };
    flashing += 1;
    const ang = (b[2] + (rnd(n, i, 0) - 0.5) * 30) * rad;
    const len = 34 + rnd(n, i, 1) * 16;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const x0: number = b[0];
    const y0 = b[1] + bodyY;
    let d = `M${f(x0)} ${f(y0)}`;
    let mx: number = x0,
      my = y0,
      ex = x0,
      ey = y0;
    for (let s = 1; s <= 4; s++) {
      const side = s === 4 ? 0 : (s % 2 ? 1 : -1) * (4 + rnd(n, i, s + 2) * 6);
      ex = x0 + (dx * (len * s)) / 4 - dy * side;
      ey = y0 + (dy * (len * s)) / 4 + dx * side;
      d += ` L${f(ex)} ${f(ey)}`;
      if (s === 2) {
        mx = ex;
        my = ey;
      }
    }
    const bang = ang + (rnd(n, i, 9) > 0.5 ? 0.7 : -0.7);
    d += ` M${f(mx)} ${f(my)} L${f(mx + Math.cos(bang) * 14)} ${f(my + Math.sin(bang) * 14)}`;
    const flicker = k < 0.05 || (k > 0.09 && k < 0.15) ? 1 : 0.35;
    return { d: d, op: flicker.toFixed(2), ex: f(ex), ey: f(ey), r: (2 + flicker * 2).toFixed(1) };
  });
  return {
    energy: h,
    run,
    droop,
    scale: 0.72 + stageOf(stats).index * 0.07,
    lobeScale: 0.92 + clamp(stats.brain) * 0.0016,
    eyeRadius: 6 + clamp(stats.eyes) * 0.03,
    limbWidth: 5 + clamp(stats.arms) * 0.025,
    handRadius: 5.5 + clamp(stats.arms) * 0.02,
    flags: {
      sleepyZ: sleepy,
      backpack: stats.resp >= 70 || earned.includes("captainBackpack"),
      cape: earned.includes("heroCape") && !equipped.back,
      badge: earned.includes("explorerBadge"),
      garden: earned.includes("ownGarden"),
    },
    glowY: f(100 + bodyY),
    glowR: flashing ? 114 : 108,
    glowOp: (
      (0.1 + 0.05 * Math.sin(t * 2.5)) * electric +
      (flashing ? 0.14 * electric : 0)
    ).toFixed(3),
    b0: at(bolts, 0),
    b1: at(bolts, 1),
    b2: at(bolts, 2),
    b3: at(bolts, 3),
    b4: at(bolts, 4),
    b5: at(bolts, 5),
    b6: at(bolts, 6),
    fill: pal[0],
    shade: pal[1],
    fold: pal[2],
    bodyTransform: `translate(0 ${f(bodyY)}) translate(110 168) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(-110 -168)`,
    shadowRx: f(58 - bob * 2),
    armL: aL.path,
    armR: aR.path,
    handLx: f(aL.hx),
    handLy: f(aL.hy),
    handRx: f(aR.hx),
    handRy: f(aR.hy),
    legL: lL.path,
    legR: lR.path,
    shoeLx: f(lL.sx),
    shoeLy: f(lL.sy),
    shoeRx: f(lR.sx),
    shoeRy: f(lR.sy),
    talk: voice,
    talkMouth: { y: endY + 3, rx: mouthWidth * (0.55 + voice * 0.15), ry: 2 + voice * 11 },
    mouth: `M${110 - mouthWidth} ${f(endY)} Q110 ${f(ctrlY)} ${110 + mouthWidth} ${f(endY)}`,
    lid: f(lid),
    rotOpacity: effects === "full" && h < 60 ? Math.min(1, (60 - h) / 45) : 0,
    cheekOpacity: c01((h - 50) / 20) * 0.55,
    sparkleOpacity: h >= 75 ? (0.55 + 0.45 * Math.sin(t * 3)).toFixed(2) : 0,
    star1: star(0, 34, 12),
    star2: star(222, 28, 8),
    star3: star(214, 186, 10),
    star4: star(4, 184, 7),
    sweat:
      "M" +
      swx +
      " " +
      f(swy - 7) +
      " Q" +
      (swx + 5.5) +
      " " +
      f(swy + 1) +
      " " +
      swx +
      " " +
      f(swy + 4.5) +
      " Q" +
      (swx - 5.5) +
      " " +
      f(swy + 1) +
      " " +
      swx +
      " " +
      f(swy - 7) +
      " Z",
    sweatOpacity: h >= 20 && h < 55 ? (1 - sweatK).toFixed(2) : 0,
    w0: at(wisps, 0),
    w1: at(wisps, 1),
    w2: at(wisps, 2),
    w3: at(wisps, 3),
    w4: at(wisps, 4),
    w5: at(wisps, 5),
    w6: at(wisps, 6),
    z0: at(haze, 0),
    z1: at(haze, 1),
    z2: at(haze, 2),
    z3: at(haze, 3),
    z4: at(haze, 4),
    z5: at(haze, 5),
    p0: at(puffs, 0),
    p1: at(puffs, 1),
    p2: at(puffs, 2),
    p3: at(puffs, 3),
    p4: at(puffs, 4),
    f0: at(flies, 0),
    f1: at(flies, 1),
    f2: at(flies, 2),
    f3: at(flies, 3),
    f4: at(flies, 4),
    f5: at(flies, 5),
  };
}
export type BrainyModel = ReturnType<typeof brainyModel>;
