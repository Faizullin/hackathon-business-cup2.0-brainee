"use client";
import { createId, HostBridge } from "@brainee/game-bridge";
import type { Preview } from "@brainee/game-catalog";
import { gameSandbox } from "@brainee/game-catalog/remote";
import { ArrowLeft } from "@brainee/ui/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { iconControl, PlayerHeader, playerSurface } from "@/components/game/PlayerHeader";
import { useI18n } from "@/i18n";

// Separate from LearningProvider: no issued session and no round/finish callbacks.
export function ExplorePlayer({ game }: { game: Preview }) {
  const { snapshot } = useLearning();
  const { t } = useI18n();
  const age = snapshot ? new Date().getFullYear() - snapshot.child.birthYear : 0;
  return (
    <LearningBoundary game>
      {age < game.minAge ? (
        <section className="p-6">
          <p>{t.learn.lockedAge(game.minAge)}</p>
          <Link href="/explore">{t.learn.title}</Link>
        </section>
      ) : (
        <AvailablePreview game={game} />
      )}
    </LearningBoundary>
  );
}

export function AvailablePreview({ game, onReady }: { game: Preview; onReady?(): void }) {
  const readyCallback = useRef(onReady);
  readyCallback.current = onReady;
  const frame = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("loading");
  const router = useRouter();
  const { locale, t } = useI18n();
  const meta = game.explore;
  const ready = useRef(false);
  useEffect(() => {
    let stopped = false;
    ready.current = false;
    const timer = setTimeout(() => {
      if (!stopped && !ready.current) {
        bridge.close();
        setStatus("error");
      }
    }, 10000);
    const bridge = new HostBridge({
      frame: () => frame.current?.contentWindow,
      context: { sessionId: createId(), gameId: game.id, version: game.version, locale },
      config: { mode: "explore", protocols: [2, 1] },
      acceptHello: (hello) => hello.contract === `${game.id}@1`,
      validateEvent: () => null,
      onLifecycle(phase) {
        if (stopped) return;
        if (phase === "ready") {
          clearTimeout(timer);
          ready.current = true;
          readyCallback.current?.();
          setStatus("ready");
        }
        if (phase === "error") {
          clearTimeout(timer);
          bridge.close();
          setStatus("error");
        }
      },
    });
    function exit(event: MessageEvent) {
      if (
        event.origin === (game.source === "remote" ? "null" : location.origin) &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "brainee:exit" &&
        event.data?.gameId === game.id
      )
        router.push("/explore");
    }
    window.addEventListener("message", exit);
    bridge.start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      bridge.close();
      window.removeEventListener("message", exit);
    };
  }, [game.id, game.version, game.source, locale, router]);
  // Games without a bridge handshake are ready once their document has loaded.
  const loaded = () => {
    if (meta.readiness !== "load") return;
    ready.current = true;
    setStatus((current) => (current === "error" ? current : "ready"));
  };
  const contain = meta.viewport === "contain" && meta.aspectRatio;
  return (
    <div className={playerSurface}>
      <PlayerHeader
        title={game.title}
        exit={
          <Link href="/explore" className={iconControl} aria-label={t.child.game.exit}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        }
        status={
          <span className="text-muted-foreground text-sm">
            {meta.audio ? "No stars · sound" : "No stars"}
          </span>
        }
      />
      {meta.orientation !== "any" && (
        <p
          data-testid="orientation-hint"
          className={`px-4 text-muted-foreground text-sm ${meta.orientation === "landscape" ? "hidden portrait:block" : "hidden landscape:block"}`}
        >
          {meta.orientation === "landscape"
            ? "Turn your device sideways for more room."
            : "Hold your device upright for more room."}
        </p>
      )}
      {status === "loading" && <p role="status">Loading…</p>}
      {status === "error" ? (
        <p role="alert">Could not load. Return to the list and try again.</p>
      ) : (
        <div
          data-testid="explore-stage"
          data-viewport={meta.viewport}
          className="flex min-h-0 flex-1 items-center justify-center"
          style={{ minHeight: "calc(100dvh - 80px)" }}
        >
          <iframe
            ref={frame}
            src={game.entry}
            title={game.title}
            data-testid="explore-frame"
            data-ready={status === "ready"}
            onLoad={loaded}
            sandbox={gameSandbox(game.source)}
            allow="camera 'none'; microphone 'none'; autoplay 'none'"
            className={contain ? "border-0" : "w-full self-stretch border-0"}
            style={
              contain
                ? {
                    aspectRatio: meta.aspectRatio,
                    // Largest box of this aspect ratio that fits the stage (letterboxed).
                    width: `min(100%, calc((100dvh - 80px) * (${meta.aspectRatio})))`,
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
