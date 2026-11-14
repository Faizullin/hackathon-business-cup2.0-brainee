// Brainy accessories. Spec: docs/product/mechanics.md#accessories.
import type { Wallet } from "./types";

export const SLOTS = ["head", "face", "neck"] as const;
export type Slot = (typeof SLOTS)[number];

/** Bought with ★, cosmetic. Earned items (backpack, badge, garden, cape) are never sold. */
export const ACCESSORIES = [
  { id: "cowboy", slot: "head", priceStars: 120 },
  { id: "cap", slot: "head", priceStars: 60 },
  { id: "phones", slot: "head", priceStars: 90 },
  { id: "glasses", slot: "face", priceStars: 80 },
  { id: "bowtie", slot: "neck", priceStars: 50 },
  { id: "scarf", slot: "neck", priceStars: 70 },
] as const satisfies readonly { id: string; slot: Slot; priceStars: number }[];

export type AccessoryId = (typeof ACCESSORIES)[number]["id"];
export type Equipped = Partial<Record<Slot, AccessoryId>>;

export const EARNED_REWARDS = [
  "captainBackpack",
  "explorerBadge",
  "ownGarden",
  "heroCape",
] as const;
export type EarnedReward = (typeof EARNED_REWARDS)[number];

export function accessory(id: AccessoryId) {
  const item = ACCESSORIES.find((a) => a.id === id);
  if (!item) throw new RangeError(`Unknown accessory: ${id}`);
  return item;
}

/** Wearing an item replaces whatever is in its slot (one per slot). */
export function equip(equipped: Equipped, id: AccessoryId): Equipped {
  return { ...equipped, [accessory(id).slot]: id };
}

export function unequip(equipped: Equipped, slot: Slot): Equipped {
  const { [slot]: _removed, ...rest } = equipped;
  return rest;
}

export type Purchase =
  | { ok: true; wallet: Wallet; owned: AccessoryId[] }
  | { ok: false; reason: "already-owned" | "not-enough-stars" };

export function buyAccessory(
  wallet: Wallet,
  owned: readonly AccessoryId[],
  id: AccessoryId,
): Purchase {
  if (owned.includes(id)) return { ok: false, reason: "already-owned" };
  const { priceStars } = accessory(id);
  if (wallet.stars < priceStars) return { ok: false, reason: "not-enough-stars" };
  return {
    ok: true,
    wallet: { stars: wallet.stars - priceStars, suns: wallet.suns },
    owned: [...owned, id],
  };
}
