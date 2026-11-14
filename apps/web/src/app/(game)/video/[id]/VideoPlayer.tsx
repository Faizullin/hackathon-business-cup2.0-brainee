"use client";

import { ArrowLeft, Pause, Play } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { SCIENCE_ICONS } from "@/components/child/LeisureScreen";
import { outlineButton, primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";

// T-37: pause/play is the only control. No seeking, no "watch next". 1 s = 1 min in the demo.
function Player({ id }: { id: string }) {
  const { snapshot, act } = useLearning();
  const router = useRouter();
  const video = snapshot?.showcase.science.find((v) => v.id === id);
  const [position, setPosition] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const saved = useRef(false);
  const { t: i18n } = useI18n();
  const t = i18n.child.video;
  useEffect(() => {
    if (video && position === null) setPosition(video.solved ? 0 : video.position);
  }, [video, position]);
  useEffect(() => {
    if (!playing || !video) return;
    const timer = setInterval(() => {
      setPosition((p) => {
        const next = Math.min((p ?? 0) + 1, video.minutes);
        if (next >= video.minutes) setPlaying(false);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, video]);
  const finished = !!video && position !== null && position >= video.minutes;
  useEffect(() => {
    if (finished && video && !saved.current) {
      saved.current = true;
      void act({ type: "video-position", id: video.id, position: video.minutes });
    }
  }, [finished, video, act]);
  if (!video || position === null) return null;
  const Icon = SCIENCE_ICONS[video.icon as keyof typeof SCIENCE_ICONS] ?? Play;
  const close = async () => {
    setPlaying(false);
    if (!finished) await act({ type: "video-position", id: video.id, position });
    router.push("/leisure");
  };
  const answer = async (index: number) => {
    const error = await act({ type: "video-answer", id: video.id, answer: index });
    if (error === "wrong-answer") setWrong((w) => [...w, index]);
    else if (!error) setSolved(true);
  };
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={close} className={outlineButton}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t.close}
        </button>
      </div>
      <h1 className="text-2xl">{video.title}</h1>
      <div
        className="relative grid aspect-video place-items-center overflow-hidden rounded-panel text-white"
        style={{ background: `linear-gradient(135deg, ${video.colors[0]}, ${video.colors[1]})` }}
      >
        <Icon
          aria-hidden="true"
          className={cn("size-24 transition-transform duration-700", playing && "animate-pulse")}
        />
        <span className="absolute right-3 bottom-3 rounded-full bg-black/30 px-3 py-1 text-xs">
          {t.speedNote}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={finished}
          onClick={() => setPlaying((p) => !p)}
          className={cn(primaryButton, "min-h-14 min-w-14")}
          aria-label={playing ? t.pause : t.play}
        >
          {playing ? <Pause className="size-6" /> : <Play className="size-6" />}
        </button>
        <div className="flex-1">
          <div
            role="progressbar"
            aria-label={t.progress}
            aria-valuemin={0}
            aria-valuemax={video.minutes}
            aria-valuenow={position}
            className="h-3 overflow-hidden rounded-full bg-line"
          >
            <span
              className="block h-full rounded-full bg-sky transition-[width] duration-1000 ease-linear"
              style={{ width: `${(position / video.minutes) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            {position} / {i18n.child.leisure.minutes(video.minutes)}
          </p>
        </div>
      </div>
      {finished && (
        <div
          className="flex flex-col gap-3 rounded-panel border border-border bg-card p-4"
          data-testid="video-quiz"
        >
          <h2 className="font-heading font-semibold text-lg">{t.question}</h2>
          <p>{video.question}</p>
          {solved ? (
            <>
              <p role="status" className="rounded-xl bg-mint/15 p-3 font-semibold">
                {t.correct}
              </p>
              <Link href="/leisure" className={primaryButton}>
                {t.back}
              </Link>
            </>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              {video.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  disabled={wrong.includes(index)}
                  onClick={() => answer(index)}
                  className={cn("min-h-14 text-base", wrong.includes(index) && "opacity-30")}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          {wrong.length > 0 && !solved && <p role="alert">{t.wrong}</p>}
        </div>
      )}
    </section>
  );
}

export function VideoPlayer({ id }: { id: string }) {
  return (
    <LearningBoundary game>
      <Player id={id} />
    </LearningBoundary>
  );
}
