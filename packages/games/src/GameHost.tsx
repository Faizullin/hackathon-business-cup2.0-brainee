"use client";

import { Component, type ComponentType, lazy, type ReactNode, Suspense } from "react";
import type { GameDefinition, GameProps } from "./kit";

type HostProps = Omit<GameProps, "level"> & {
  game: GameDefinition;
  level: number;
  onError?(error: Error): void;
};

// One lazy component per game id, so each game is its own chunk and loads once.
const lazyGames = new Map<string, ComponentType<GameProps>>();

function lazyGame(game: Extract<GameDefinition, { runtime: "react" }>) {
  let Game = lazyGames.get(game.id);
  if (!Game) {
    Game = lazy(game.load);
    lazyGames.set(game.id, Game);
  }
  return Game;
}

class GameErrorBoundary extends Component<
  { children: ReactNode; onError?(error: Error): void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.failed) {
      return (
        <p role="alert" className="p-6 text-center font-medium">
          Игра не загрузилась. Попробуй ещё раз позже.
        </p>
      );
    }
    return this.props.children;
  }
}

/**
 * Runs any game behind the shared contract. The caller remounts it with a new `key`
 * to restart; rewards are never granted here (the server uses packages/core).
 */
export function GameHost({ game, onError, ...props }: HostProps) {
  if (game.runtime === "embedded") {
    // IframeGame + bridge: T-29.
    return (
      <p role="status" className="p-6 text-center">
        Эта игра пока недоступна.
      </p>
    );
  }
  const Game = lazyGame(game);
  return (
    <GameErrorBoundary onError={onError}>
      <Suspense
        fallback={
          <p role="status" className="p-6 text-center text-muted-foreground">
            Загружаем игру…
          </p>
        }
      >
        <Game {...props} />
      </Suspense>
    </GameErrorBoundary>
  );
}
