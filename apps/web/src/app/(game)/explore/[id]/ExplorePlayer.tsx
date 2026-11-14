"use client";
import { createId, HostBridge } from "@brainee/game-bridge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { useI18n } from "@/i18n";

type Preview = { id: string; title: string; entry: string; minAge: number };
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

function AvailablePreview({ game }: { game: Preview }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("loading");
  const router = useRouter();
  const { locale } = useI18n();
  useEffect(() => {
    let stopped = false;
    const timer = setTimeout(() => {
      if (!stopped) {
        bridge.close();
        setStatus("error");
      }
    }, 10000);
    const bridge = new HostBridge({
      frame: () => frame.current?.contentWindow,
      context: { sessionId: createId(), gameId: game.id, version: "0.1.0", locale },
      config: { mode: "explore", protocols: [2, 1] },
      acceptHello: (hello) => hello.contract === `${game.id}@1`,
      validateEvent: () => null,
      onLifecycle(phase) {
        if (stopped) return;
        if (phase === "ready") {
          clearTimeout(timer);
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
        event.origin === location.origin &&
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
  }, [game.id, locale, router]);
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-2">
      <header className="flex items-center justify-between gap-3 px-4">
        <Link href="/explore" className="min-h-12 py-3">
          ← Exit
        </Link>
        <h1 className="text-lg">{game.title}</h1>
        <span className="text-sm">No stars</span>
      </header>
      {status === "loading" && <p role="status">Loading…</p>}
      {status === "error" ? (
        <p role="alert">Could not load. Return to the list and try again.</p>
      ) : (
        <iframe
          ref={frame}
          src={game.entry}
          title={game.title}
          data-testid="explore-frame"
          data-ready={status === "ready"}
          sandbox="allow-scripts allow-same-origin"
          allow="camera 'none'; microphone 'none'"
          className="w-full flex-1 border-0"
          style={{ minHeight: "calc(100dvh - 80px)" }}
        />
      )}
    </div>
  );
}
