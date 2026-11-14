"use client";

import {
  finishLearningSession,
  type GameResult,
  isLearningProgress,
  type LearningProgress,
  newStreak,
  stopLearningSession,
} from "@brainee/core";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { demoChild } from "@/lib/demo-child";

const STORAGE_KEY = "brainee-learning-preview-v1";
type State = { progress: LearningProgress; resting: boolean };
const initial = (): State => ({
  progress: {
    stats: { ...demoChild.stats },
    wallet: { ...demoChild.wallet },
    mood: demoChild.mood,
    streak: newStreak(),
  },
  resting: false,
});
type Context = State & {
  ready: boolean;
  finish(result: GameResult): ReturnType<typeof finishLearningSession>;
  stop(): void;
};
const ProgressContext = createContext<Context | null>(null);

// Per-tab preview only. T-54/T-55 will replace this with server-owned state.
export function DemoProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: unknown = JSON.parse(raw);
        if (
          saved &&
          typeof saved === "object" &&
          "progress" in saved &&
          isLearningProgress(saved.progress)
        ) {
          const restored = {
            progress: saved.progress,
            resting: "resting" in saved && saved.resting === true,
          };
          current.current = restored;
          setState(restored);
        }
      }
    } catch {
      /* Blocked/corrupt storage falls back to an in-memory preview. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* Memory still works. */
      }
    }
  }, [state, ready]);

  function finish(result: GameResult) {
    const completion = finishLearningSession(current.current.progress, result);
    const next = { progress: completion.after, resting: false };
    current.current = next;
    setState(next);
    return completion;
  }
  function stop() {
    const next = { progress: stopLearningSession(current.current.progress), resting: true };
    current.current = next;
    setState(next);
  }
  return <ProgressContext value={{ ...state, ready, finish, stop }}>{children}</ProgressContext>;
}

export function useDemoProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("DemoProgressProvider is missing.");
  return value;
}
