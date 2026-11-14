"use client";

import type {
  GameResult,
  LearningCompletion,
  ShowcaseAction,
  StateReply,
  StateSnapshot,
} from "@brainee/core";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { localizeContent, translateContent, useI18n } from "@/i18n";
import {
  type FinishReply,
  type IssuedGame,
  learningRequest,
  type PendingFinish,
  readPendingFinish,
  storePendingFinish,
} from "@/lib/learning-api";

import { StageCelebration } from "./StageCelebration";

const STATE_KEY = ["child-state"] as const;
type Context = {
  snapshot: StateSnapshot | undefined;
  ready: boolean;
  error: Error | null;
  resting: boolean;
  pending: PendingFinish | null;
  refresh(): Promise<StateSnapshot>;
  start(gameId: string, level: number, seed?: number): Promise<IssuedGame>;
  finish(issued: IssuedGame, result: GameResult): Promise<LearningCompletion>;
  stop(): Promise<void>;
  discardPending(): void;
  /** Runs one demo action on the server, then refreshes; returns a failure reason or null. */
  act(action: ShowcaseAction): Promise<string | null>;
  unlockParent(pin: string, adult?: boolean): Promise<boolean>;
  lockParent(): Promise<void>;
};

export type ActionReply = { ok: true } | { error: string };
async function postJson(path: string, body: unknown, method = "POST") {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const reply = (await response.json().catch(() => ({}))) as { error?: string };
  return { status: response.status, error: response.ok ? null : (reply.error ?? "unavailable") };
}
const LearningContext = createContext<Context | null>(null);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <SharedLearning>{children}</SharedLearning>
    </QueryClientProvider>
  );
}

function SharedLearning({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const pathname = usePathname();
  const active =
    /^\/(learn|leisure|gifts|brainy|game|entry|video|analytics|tasks|rewards|settings|fun|cartoon|explore)(\/|$)/.test(
      pathname,
    );
  const accessReady = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [resting, setResting] = useState(false);
  const [pending, setPending] = useState<PendingFinish | null>(null);
  const pendingRef = useRef<PendingFinish | null>(null);
  const inFlight = useRef<Promise<LearningCompletion> | null>(null);
  useEffect(() => {
    const saved = readPendingFinish();
    pendingRef.current = saved;
    setPending(saved);
    if (!saved) storePendingFinish(null);
    try {
      sessionStorage.removeItem("brainee-learning-preview-v1");
    } catch {
      /* Legacy preview is never read. */
    }
    setHydrated(true);
  }, []);

  const readState = useCallback(
    async ({ signal }: { signal?: AbortSignal } = {}) => {
      if (!accessReady.current) {
        await learningRequest("/api/demo-session", { post: true, signal });
        accessReady.current = true;
      }
      const cached = client.getQueryData<StateSnapshot>(STATE_KEY);
      const reply = await learningRequest<StateReply>(
        `/api/state${cached ? `?since=${cached.version}` : ""}`,
        { signal },
      );
      const latest = client.getQueryData<StateSnapshot>(STATE_KEY);
      if (!reply.changed) {
        if (!latest) throw new Error("An unchanged snapshot needs cached state.");
        return latest;
      }
      // A delayed read must not replace a newer response.
      return latest && latest.version > reply.snapshot.version ? latest : reply.snapshot;
    },
    [client],
  );
  const state = useQuery({
    queryKey: STATE_KEY,
    queryFn: readState,
    enabled: active,
    staleTime: 0,
    retry: false,
    refetchInterval: (query) => (query.state.data ? 3000 : false),
  });
  const { locale } = useI18n();
  // Seeded showcase text and game titles follow the device locale; logic keeps the raw data.
  const snapshot = useMemo(
    () =>
      state.data && {
        ...state.data,
        showcase: localizeContent(state.data.showcase, locale),
        latestGame: state.data.latestGame && {
          ...state.data.latestGame,
          title: translateContent(state.data.latestGame.title, locale),
        },
      },
    [state.data, locale],
  );
  useEffect(() => {
    if (state.error && "status" in state.error && state.error.status === 419)
      window.location.replace("/login");
  }, [state.error]);
  const refresh = useCallback(async () => {
    await client.cancelQueries({ queryKey: STATE_KEY });
    return client.fetchQuery({
      queryKey: STATE_KEY,
      queryFn: readState,
      staleTime: 0,
      retry: false,
    });
  }, [client, readState]);
  const start = useCallback(async (gameId: string, level: number, seed?: number) => {
    if (pendingRef.current)
      throw new Error("Resolve the pending result before starting another game.");
    const issued = await learningRequest<IssuedGame>("/api/sessions/start", {
      post: true,
      body: {
        gameId,
        level,
        recommended: new URLSearchParams(window.location.search).get("recommended") === "1",
        ...(seed === undefined ? {} : { seed }),
      },
    });
    setResting(false);
    return issued;
  }, []);
  const finish = useCallback(
    (issued: IssuedGame, result: GameResult): Promise<LearningCompletion> => {
      if (pendingRef.current && pendingRef.current.issued.sessionId !== issued.sessionId)
        return Promise.reject(new Error("Another result is pending."));
      if (inFlight.current) return inFlight.current;
      const value = { issued, result };
      pendingRef.current = value;
      storePendingFinish(value);
      setPending(value);
      const work = (async () => {
        const reply = await learningRequest<FinishReply>("/api/sessions", {
          post: true,
          body: { sessionId: issued.sessionId, result },
        });
        // Receipts are historical. Only a fresh state read updates the shared wallet.
        await refresh();
        pendingRef.current = null;
        storePendingFinish(null);
        setPending(null);
        return reply.completion;
      })();
      inFlight.current = work;
      void work
        .finally(() => {
          inFlight.current = null;
        })
        .catch(() => {});
      return work;
    },
    [refresh],
  );
  const stop = useCallback(async () => {
    await learningRequest("/api/sessions/stop", { post: true });
    await refresh();
    setResting(true);
  }, [refresh]);
  const act = useCallback(
    async (action: ShowcaseAction) => {
      const { error } = await postJson("/api/actions", action);
      await refresh().catch(() => {});
      return error;
    },
    [refresh],
  );
  const unlockParent = useCallback(
    async (pin: string, adult = false) => {
      const { error } = await postJson("/api/parent", adult ? { answer: pin } : { pin });
      await refresh().catch(() => {});
      return error === null;
    },
    [refresh],
  );
  const lockParent = useCallback(async () => {
    await postJson("/api/parent", {}, "DELETE");
    await refresh().catch(() => {});
  }, [refresh]);
  const discardPending = useCallback(() => {
    pendingRef.current = null;
    storePendingFinish(null);
    setPending(null);
  }, []);
  return (
    <LearningContext
      value={{
        snapshot,
        ready: hydrated && !!state.data,
        error: state.error,
        resting,
        pending,
        refresh,
        start,
        finish,
        stop,
        discardPending,
        act,
        unlockParent,
        lockParent,
      }}
    >
      {children}
      <StageCelebration
        snapshot={snapshot}
        enabled={/^\/(learn|leisure|gifts|brainy|game|entry|video|fun|cartoon)(\/|$)/.test(
          pathname,
        )}
      />
    </LearningContext>
  );
}

export function useLearning() {
  const value = useContext(LearningContext);
  if (!value) throw new Error("LearningProvider is missing.");
  return value;
}
