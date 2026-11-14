import { type FunnelDraft, restoreFunnel, STORAGE_KEY, VERSION } from "@brainee/core";

const TOUR_KEY = "brainy.onboarding.review";
export function funnelStorage() {
  const tour = new URLSearchParams(window.location.search).get("tour") === "1";
  return {
    storage: tour ? window.sessionStorage : window.localStorage,
    key: tour ? TOUR_KEY : STORAGE_KEY,
  };
}
export function loadFunnel() {
  try {
    const { storage, key } = funnelStorage();
    return restoreFunnel(storage.getItem(key));
  } catch {
    return restoreFunnel(null);
  }
}
export function saveFunnel(screen: string, answers: FunnelDraft) {
  try {
    const { storage, key } = funnelStorage();
    const resumeAt = screen === "cover" ? restoreFunnel(storage.getItem(key)).resumeAt : screen;
    storage.setItem(key, JSON.stringify({ version: VERSION, screen, resumeAt, answers }));
  } catch {
    /* The current session still works when storage is unavailable. */
  }
}
