"use client";

import { Component, type ComponentType, lazy, type ReactNode, Suspense } from "react";
import { IframeGame } from "./IframeGame";
import type { GameDefinition, GameProps } from "./kit";

type HostProps = Omit<GameProps, "level"> & {
  game: GameDefinition;
  level: number;
  onReady?(): void;
  sessionId?: string;
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
  { children: ReactNode; message: string; onError?(error: Error): void },
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
          {this.props.message}
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
    return (
      <GameErrorBoundary onError={onError} message={props.text.loadError}>
        <IframeGame game={game} onError={onError} {...props} />
      </GameErrorBoundary>
    );
  }
  const Game = lazyGame(game);
  return (
    <GameErrorBoundary onError={onError} message={props.text.loadError}>
      <Suspense
        fallback={
          <p role="status" className="p-6 text-center text-muted-foreground">
            {props.text.loading}
          </p>
        }
      >
        <Game {...props} />
      </Suspense>
    </GameErrorBoundary>
  );
}
