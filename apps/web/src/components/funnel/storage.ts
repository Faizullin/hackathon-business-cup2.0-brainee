import {
  QUIZ_STORAGE_KEY,
  QUIZ_VERSION,
  type QuizDraft,
  restoreQuiz,
  STARTER_DEADLINE_KEY,
} from "@brainee/core";

const TOUR_KEY = "brainy.onboarding.review";
/** `?tour=1` keeps the review run in session storage so it never touches the saved answers. */
export function funnelStorage() {
  const tour = new URLSearchParams(window.location.search).get("tour") === "1";
  return {
    storage: tour ? window.sessionStorage : window.localStorage,
    key: tour ? TOUR_KEY : QUIZ_STORAGE_KEY,
  };
}
export function loadFunnel() {
  try {
    const { storage, key } = funnelStorage();
    return restoreQuiz(storage.getItem(key));
  } catch {
    return restoreQuiz(null);
  }
}
export function saveFunnel(screen: string, draft: QuizDraft) {
  try {
    const { storage, key } = funnelStorage();
    storage.setItem(key, JSON.stringify({ version: QUIZ_VERSION, screen, answers: draft }));
  } catch {
    /* The current session still works when storage is unavailable. */
  }
}
/** `?reset=1`: forget the quiz and the Starter Pack timer so it can be shown again. */
export function resetFunnel() {
  try {
    for (const storage of [window.localStorage, window.sessionStorage]) {
      for (const key of [QUIZ_STORAGE_KEY, TOUR_KEY, STARTER_DEADLINE_KEY]) storage.removeItem(key);
    }
  } catch {
    /* Nothing to clear. */
  }
}
