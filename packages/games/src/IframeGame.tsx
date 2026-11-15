"use client";

import { BRIDGE_PROTOCOL, createId, HostBridge } from "@brainee/game-bridge";
import { validateLearningEvent } from "@brainee/game-bridge/learning";
import { gameSandbox } from "@brainee/game-catalog/remote";
import { useEffect, useRef, useState } from "react";
import type { GameDefinition, GameProps } from "./kit";

type Props = GameProps & {
  game: Extract<GameDefinition, { runtime: "embedded" }>;
  sessionId?: string;
  onReady?(): void;
  onError?(error: Error): void;
};

export function IframeGame(props: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const { game, level, seed, sessionId } = props;
  useEffect(() => {
    let stopped = false;
    let finished = false;
    let isReady = false;
    let completed = 0;
    let mistakes = 0;
    let corrections = 0;
    function fail(message: string) {
      if (stopped || finished) return;
      stopped = true;
      clearTimeout(timer);
      bridge.close();
      setFailed(true);
      latest.current.onError?.(new Error(message));
    }
    const timer = setTimeout(() => fail(latest.current.text.loadError), 10000);
    const bridge = new HostBridge({
      frame: () => frame.current?.contentWindow,
      context: {
        sessionId: sessionId ?? createId(),
        gameId: game.id,
        version: game.version,
        locale: props.locale ?? "en",
      },
      config: { level, seed, protocols: [BRIDGE_PROTOCOL, BRIDGE_PROTOCOL - 1] },
      handshakeTimeoutMs: 10000,
      acceptHello: (hello) => hello.contract === `${game.id}@1`,
      validateEvent: validateLearningEvent,
      onLifecycle(phase) {
        if (stopped || finished) return;
        if (phase === "ready" && !isReady) {
          isReady = true;
          clearTimeout(timer);
          setReady(true);
          latest.current.onReady?.();
        } else if (phase === "error") fail(latest.current.text.runtimeError);
      },
      onEvent(event) {
        if (stopped || finished || !isReady) return;
        const payload = event.payload;
        if (event.name === "round") {
          if (completed >= game.roundsPerSession) return;
          const round = {
            correct: payload.correct === true,
            afterMistake: payload.afterMistake === true,
          };
          if (round.correct) {
            completed++;
            if (round.afterMistake) corrections++;
          } else mistakes++;
          latest.current.onRound(round);
        } else if (event.name === "finish") {
          if (
            payload.gameId !== game.id ||
            payload.level !== level ||
            payload.rounds !== game.roundsPerSession ||
            completed !== game.roundsPerSession ||
            payload.mistakes !== mistakes ||
            payload.corrections !== corrections
          )
            return;
          finished = true;
          clearTimeout(timer);
          latest.current.onFinish({
            gameId: game.id,
            level,
            rounds: game.roundsPerSession,
            mistakes,
            corrections,
            durationMs: payload.durationMs as number,
          });
        }
      },
    });
    bridge.start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      bridge.close();
    };
  }, [game.id, game.version, game.roundsPerSession, level, seed, sessionId, props.locale]);
  if (failed)
    return (
      <p role="alert" className="p-6 text-center">
        {props.text.loadError}
      </p>
    );
  return (
    <iframe
      ref={frame}
      title={game.title}
      data-testid="embedded-game"
      data-ready={ready}
      src={`${game.runtimeUrl}?level=${level}&seed=${seed}`}
      sandbox={gameSandbox(game.source)}
      className="w-full flex-1 border-0"
      style={{ minHeight: "min(600px, calc(100dvh - 100px))" }}
    />
  );
}
