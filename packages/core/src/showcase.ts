// Demo "showcase" content: seeded presentation data (analytics, tasks, gifts, leisure)
// plus the small set of interactions the MVP demo needs. Analytics numbers are seeded,
// not calculated (see docs/dev/decisions.md D-21). Economy rules reuse economy/accessories.
import {
  ACCESSORIES,
  type AccessoryId,
  buyAccessory,
  type Equipped,
  equip,
  SLOTS,
  type Slot,
  unequip,
} from "./accessories";
import { buyGift, exchangeSuns } from "./economy";
import type { Ability, Wallet } from "./types";

export const TASKS_PER_DAY = 5;
export const FUN_PRICES = { timedMinutes: 10 } as const;
export const VIDEO_QUIZ_STARS = 15;
export const VIDEO_QUIZ_EYES = 2;
export const TASK_RESP_GAIN = 2;

export type TaskPlace = "real" | "app";
export type TaskStatus = "todo" | "check" | "done";
export type Task = {
  id: string;
  title: string;
  place: TaskPlace;
  skill: string;
  reward: number;
  status: TaskStatus;
};
export type TaskTemplate = { title: string; reward: number; skill: string };
export type ParentRecommendation = {
  id: string;
  skill: string;
  value: number;
  average: number;
  part: string;
  why: string;
  items: { id: string; title: string; reward: number; duration: string }[];
};
export type Gift = { id: string; title: string; price: number };
export type GiftRequest = {
  id: string;
  giftId: string;
  title: string;
  at: string;
  delivered: boolean;
};
export type FunGame = {
  id: string;
  title: string;
  skill: string;
  icon: string;
  priceTimed: number;
  priceForever: number;
  forever: boolean;
  /** ISO time the timed unlock ends, if any. */
  until: string | null;
};
export type Cartoon = { id: string; title: string; detail: string; price: number; owned: boolean };
export type ScienceVideo = {
  id: string;
  title: string;
  minutes: number;
  icon: string;
  colors: [string, string];
  question: string;
  options: string[];
  answer: number;
  position: number;
  solved: boolean;
};
export type RankRow = { place: number; name: string; value: string; me?: boolean };
export type RankTable = { summary: string; rows: RankRow[] };
export type Analytics = {
  weeks: number;
  quizStats: Record<"brain" | "eyes" | "mouth" | "arms" | "legs" | "resp", number>;
  metrics: {
    focusMinutes: number;
    focusDelta: string;
    streakDays: number;
    streakNote: string;
    takesRecommendation: number;
    recommendationDelta: string;
  };
  insight: {
    improved: string;
    improvedDelta: number;
    lagging: string;
    value: number;
    average: number;
  };
  skills: { labels: string[]; now: number[]; monthAgo: number[]; average: number[] };
  character: { labels: string[]; now: number[]; monthAgo: number[] };
  week: { days: string[]; learning: number[]; science: number[]; fun: number[] };
  hardThing: { weeks: string[]; share: number[]; finished: number; recommended: number };
  ranking: Record<"district" | "city" | "country", Record<"growth" | "absolute", RankTable>>;
  recap: { month: string; achievements: string[]; referral: string };
};

export type Showcase = {
  equipped: Equipped;
  owned: AccessoryId[];
  earned: string[];
  weekGoal: { earned: number; target: number; giftId: string; due: string };
  tasks: Task[];
  templates: TaskTemplate[];
  recommendations: ParentRecommendation[];
  gifts: Gift[];
  requests: GiftRequest[];
  fun: FunGame[];
  cartoons: Cartoon[];
  science: ScienceVideo[];
  ageAverages: Record<Ability, number>;
  entryLog: { took: number; other: number };
  analytics: Analytics;
};

export type ShowcaseAction =
  | { type: "buy-accessory"; id: AccessoryId }
  | { type: "equip"; id: AccessoryId }
  | { type: "unequip"; slot: Slot }
  | { type: "exchange"; suns: number }
  | { type: "buy-gift"; giftId: string }
  | { type: "task-done"; taskId: string }
  | { type: "unlock-fun"; gameId: string; mode: "timed" | "forever" }
  | { type: "buy-cartoon"; id: string }
  | { type: "video-position"; id: string; position: number }
  | { type: "video-answer"; id: string; answer: number }
  | { type: "entry-choice"; took: boolean }
  // Parent-only actions:
  | { type: "task-confirm"; taskId: string }
  | {
      type: "task-add";
      title: string;
      place: TaskPlace;
      skill: string;
      reward: number;
    }
  | { type: "recommendation-assign"; recommendationId: string; itemId: string }
  | { type: "gift-add"; title: string; price: number }
  | { type: "gift-remove"; giftId: string }
  | { type: "gift-deliver"; requestId: string }
  | { type: "goal-set"; target: number; giftId: string };

export const PARENT_ACTIONS = new Set<ShowcaseAction["type"]>([
  "task-confirm",
  "task-add",
  "recommendation-assign",
  "gift-add",
  "gift-remove",
  "gift-deliver",
  "goal-set",
]);

export type ShowcaseInput = { showcase: Showcase; wallet: Wallet; now: Date; id: string };
export type ShowcaseOutcome =
  | {
      ok: true;
      showcase: Showcase;
      wallet: Wallet;
      /** Additive Brainy stat changes, applied with applyStatGains. */
      gains: { eyes?: number; resp?: number };
    }
  | { ok: false; reason: string };

const fail = (reason: string): ShowcaseOutcome => ({ ok: false, reason });
const text = (value: unknown, max = 80) =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
const count = (value: unknown, max: number) =>
  Number.isInteger(value) && (value as number) > 0 && (value as number) <= max;

/** Pure reducer: validates one demo action and returns the next showcase, wallet and gains. */
export function applyShowcaseAction(input: ShowcaseInput, action: ShowcaseAction): ShowcaseOutcome {
  const { wallet, now, id } = input;
  const s: Showcase = structuredClone(input.showcase);
  const ok = (next: Wallet = wallet, gains: { eyes?: number; resp?: number } = {}) =>
    ({ ok: true, showcase: s, wallet: next, gains }) as const;
  switch (action.type) {
    case "buy-accessory": {
      const result = buyAccessory(wallet, s.owned, action.id);
      if (!result.ok) return fail(result.reason);
      s.owned = result.owned;
      s.equipped = equip(s.equipped, action.id);
      return ok(result.wallet);
    }
    case "equip":
      if (!s.owned.includes(action.id)) return fail("not-owned");
      s.equipped = equip(s.equipped, action.id);
      return ok();
    case "unequip":
      s.equipped = unequip(s.equipped, action.slot);
      return ok();
    case "exchange": {
      const result = exchangeSuns(wallet, action.suns);
      return result.ok ? ok(result.wallet) : fail(result.reason);
    }
    case "buy-gift": {
      const gift = s.gifts.find((g) => g.id === action.giftId);
      if (!gift) return fail("not-found");
      const result = buyGift(wallet, gift.price);
      if (!result.ok) return fail(result.reason);
      s.requests.unshift({
        id,
        giftId: gift.id,
        title: gift.title,
        at: now.toISOString(),
        delivered: false,
      });
      return ok(result.wallet);
    }
    case "task-done": {
      const task = s.tasks.find((t) => t.id === action.taskId);
      if (task?.place !== "real" || task.status !== "todo") return fail("invalid-task");
      task.status = "check";
      return ok();
    }
    case "task-confirm": {
      const task = s.tasks.find((t) => t.id === action.taskId);
      if (task?.status !== "check") return fail("invalid-task");
      task.status = "done";
      if (task.place === "app") return ok({ ...wallet, stars: wallet.stars + task.reward });
      s.weekGoal.earned += task.reward;
      return ok({ ...wallet, suns: wallet.suns + task.reward }, { resp: TASK_RESP_GAIN });
    }
    case "task-add": {
      if (s.tasks.length >= TASKS_PER_DAY) return fail("daily-limit");
      if (!text(action.title) || !text(action.skill, 40) || !["real", "app"].includes(action.place))
        return fail("invalid-input");
      if (!count(action.reward, action.place === "real" ? 20 : 100)) return fail("invalid-input");
      s.tasks.push({
        id,
        title: action.title.trim(),
        place: action.place,
        skill: action.skill.trim(),
        reward: action.reward,
        status: "todo",
      });
      return ok();
    }
    case "recommendation-assign": {
      if (s.tasks.length >= TASKS_PER_DAY) return fail("daily-limit");
      const rec = s.recommendations.find((r) => r.id === action.recommendationId);
      const item = rec?.items.find((i) => i.id === action.itemId);
      if (!rec || !item) return fail("not-found");
      s.tasks.push({
        id,
        title: item.title,
        place: "real",
        skill: rec.skill,
        reward: item.reward,
        status: "todo",
      });
      rec.items = rec.items.filter((i) => i.id !== item.id);
      if (rec.items.length === 0) s.recommendations = s.recommendations.filter((r) => r !== rec);
      return ok();
    }
    case "gift-add":
      if (!text(action.title, 60) || !count(action.price, 100)) return fail("invalid-input");
      s.gifts.push({ id, title: action.title.trim(), price: action.price });
      return ok();
    case "gift-remove":
      if (s.weekGoal.giftId === action.giftId) return fail("goal-gift");
      s.gifts = s.gifts.filter((g) => g.id !== action.giftId);
      return ok();
    case "gift-deliver": {
      const request = s.requests.find((r) => r.id === action.requestId);
      if (!request || request.delivered) return fail("not-found");
      request.delivered = true;
      return ok();
    }
    case "goal-set":
      if (!count(action.target, 100) || !s.gifts.some((g) => g.id === action.giftId))
        return fail("invalid-input");
      s.weekGoal = { ...s.weekGoal, target: action.target, giftId: action.giftId };
      return ok();
    case "unlock-fun": {
      const game = s.fun.find((g) => g.id === action.gameId);
      if (!game || game.forever) return fail("not-found");
      const price = action.mode === "forever" ? game.priceForever : game.priceTimed;
      if (wallet.stars < price) return fail("not-enough-stars");
      if (action.mode === "forever") game.forever = true;
      else game.until = new Date(now.getTime() + FUN_PRICES.timedMinutes * 60_000).toISOString();
      return ok({ ...wallet, stars: wallet.stars - price });
    }
    case "buy-cartoon": {
      const cartoon = s.cartoons.find((c) => c.id === action.id);
      if (!cartoon || cartoon.owned) return fail("not-found");
      if (wallet.stars < cartoon.price) return fail("not-enough-stars");
      cartoon.owned = true;
      return ok({ ...wallet, stars: wallet.stars - cartoon.price });
    }
    case "video-position": {
      const video = s.science.find((v) => v.id === action.id);
      if (!video || !Number.isInteger(action.position) || action.position < 0)
        return fail("invalid-input");
      video.position = Math.min(action.position, video.minutes);
      return ok();
    }
    case "video-answer": {
      const video = s.science.find((v) => v.id === action.id);
      if (!video || video.position < video.minutes) return fail("not-finished");
      if (action.answer !== video.answer) return fail("wrong-answer");
      if (video.solved) return ok();
      video.solved = true;
      video.position = 0;
      return ok({ ...wallet, stars: wallet.stars + VIDEO_QUIZ_STARS }, { eyes: VIDEO_QUIZ_EYES });
    }
    case "entry-choice":
      if (action.took) s.entryLog.took += 1;
      else s.entryLog.other += 1;
      return ok();
    default:
      return fail("unknown-action");
  }
}

/** Minutes left on a timed unlock (0 when expired or none). */
export function funMinutesLeft(game: FunGame, now: Date) {
  if (!game.until) return 0;
  return Math.max(0, Math.ceil((new Date(game.until).getTime() - now.getTime()) / 60_000));
}

const ACTION_TYPES = new Set([
  "buy-accessory",
  "equip",
  "unequip",
  "exchange",
  "buy-gift",
  "task-done",
  "unlock-fun",
  "buy-cartoon",
  "video-position",
  "video-answer",
  "entry-choice",
  ...PARENT_ACTIONS,
]);

/** Shape check for untrusted JSON; field rules are enforced by applyShowcaseAction. */
export function parseShowcaseAction(value: unknown): ShowcaseAction | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const action = value as Record<string, unknown>;
  if (typeof action.type !== "string" || !ACTION_TYPES.has(action.type)) return null;
  if (
    (action.type === "buy-accessory" || action.type === "equip") &&
    !ACCESSORIES.some((item) => item.id === action.id)
  )
    return null;
  if (action.type === "unequip" && !SLOTS.includes(action.slot as Slot)) return null;
  if (action.type === "unlock-fun" && action.mode !== "timed" && action.mode !== "forever")
    return null;
  return action as ShowcaseAction;
}
