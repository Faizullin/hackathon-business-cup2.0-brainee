import type { ActivitySummary } from "./activity";
import { calendarKeys, DEFAULT_TIME_ZONE } from "./calendar";
import { SUN_TO_STARS } from "./economy";
import type { FeedItem, Showcase } from "./showcase";
import type { Wallet } from "./types";

export type ParentFeedFilter = "all" | "learning" | "family" | "rewards";

export function parentFeedCategory(kind: FeedItem["kind"]): Exclude<ParentFeedFilter, "all"> {
  if (["game", "video", "app-task"].includes(kind)) return "learning";
  if (["task-done", "task-confirmed", "gift-bought", "gift-delivered"].includes(kind))
    return "family";
  return "rewards";
}

/** Group the saved feed by the family's day, regardless of the browser's timezone. */
export function parentFeedDays(
  feed: readonly FeedItem[],
  timeZone = DEFAULT_TIME_ZONE,
  filter: ParentFeedFilter = "all",
) {
  const groups = new Map<string, FeedItem[]>();
  for (const item of [...feed].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))) {
    if (filter !== "all" && parentFeedCategory(item.kind) !== filter) continue;
    if (!Number.isFinite(Date.parse(item.at))) continue;
    const day = calendarKeys(new Date(item.at), timeZone).day;
    const items = groups.get(day) ?? [];
    items.push(item);
    groups.set(day, items);
  }
  return [...groups].map(([day, items]) => ({ day, items }));
}

/** Recent feed only: omitted purchases, bonuses and older events remain in `other`.
 * A task title alone cannot identify a currency when matching tasks disagree.
 */
export function parentWalletBreakdown(
  wallet: Wallet,
  showcase: Pick<Showcase, "feed" | "tasks" | "taskHistory">,
) {
  const earned = { stars: 0, suns: 0 };
  const spent = { stars: 0, suns: 0 };
  for (const item of showcase.feed) {
    const amount = item.amount ?? 0;
    if (!Number.isFinite(amount) || amount < 0) continue;
    switch (item.kind) {
      case "game":
      case "app-task":
      case "video":
        earned.stars += amount;
        break;
      case "task-confirmed": {
        const places = new Set(
          [...showcase.tasks, ...(showcase.taskHistory ?? [])]
            .filter((task) => task.title === item.title && task.reward === amount)
            .map((task) => task.place),
        );
        if (places.size === 1) earned[places.has("app") ? "stars" : "suns"] += amount;
        break;
      }
      case "gift-bought":
        spent.suns += amount;
        break;
      case "accessory":
      case "fun":
        spent.stars += amount;
        break;
      case "exchange":
        earned.stars += amount * SUN_TO_STARS;
        spent.suns += amount;
        break;
    }
  }
  const currency = (key: keyof Wallet) => ({
    other: wallet[key] - earned[key] + spent[key],
    earned: earned[key],
    spent: spent[key],
    balance: wallet[key],
  });
  return { stars: currency("stars"), suns: currency("suns") };
}

export function parentEnergyBand(energy: number) {
  return energy < 25 ? "rest" : energy < 50 ? "warming" : energy < 75 ? "ready" : "bright";
}

export function parentWeekReport(activity?: Pick<ActivitySummary, "learning" | "science">) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const learning = activity?.learning[index] ?? 0;
    const science = activity?.science[index] ?? 0;
    return { learning, science, total: learning + science };
  });
  return {
    days,
    total: days.reduce((sum, day) => sum + day.total, 0),
    max: Math.max(1, ...days.map((day) => day.total)),
  };
}
