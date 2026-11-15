"use client";
import { manifestSchema, type Preview, previewSchema, previews } from "@brainee/game-catalog";
import { useEffect, useSyncExternalStore } from "react";
import type { GameDefinition } from "./kit";
import { allGames } from "./registry";

const initial = { games: allGames, previews: previews as readonly Preview[] };
let current = initial;
let pending: Promise<void> | undefined;
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
async function refresh() {
  pending ??= fetch("/api/games", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      const games: (GameDefinition | undefined)[] = data.games.map((value: unknown) => {
        const g = manifestSchema.parse(value);
        return g.runtime === "react"
          ? allGames.find((b) => b.id === g.id)
          : { ...g, runtimeUrl: g.entry };
      });
      current = {
        games: games.filter((g): g is GameDefinition => Boolean(g)),
        previews: data.previews.map((p: unknown) => previewSchema.parse(p)),
      };
      for (const listener of listeners) listener();
    })
    .catch(() => {
      /* Keep the last usable catalog during a transient outage. */
    })
    .finally(() => {
      pending = undefined;
    });
  await pending;
}
/** Built-ins render immediately; remote availability refreshes without a deployment. */
export function useCatalog() {
  const catalog = useSyncExternalStore(
    subscribe,
    () => current,
    () => initial,
  );
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    return () => clearInterval(timer);
  }, []);
  return catalog;
}
