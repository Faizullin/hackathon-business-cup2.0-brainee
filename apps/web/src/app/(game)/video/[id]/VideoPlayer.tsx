"use client";

import type { ScienceVideo } from "@brainee/core";
import { hasFilm } from "@brainee/films";
import { ArrowLeft, Pause, Play } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
import { SCIENCE_ICONS } from "@/components/child/LeisureScreen";
import { outlineButton, primaryButton } from "@/components/demo/kit";
import { FilmView } from "@/components/film/FilmView";
import { brainyNarrator } from "@/components/film/narrators";
import { useFilmScript } from "@/components/film/useFilmScript";
import { useI18n } from "@/i18n";

const SAVE_EVERY_SECONDS = 10; // ROUTES.md §5: save position every 10 s and on close

// The end-of-video question: the only ★ reward (+15★, eyes +2, first time only).
function FinalQuiz({ video }: { video: ScienceVideo }) {
  const { act } = useLearning();
  const [wrong, setWrong] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const { t: i18n } = useI18n();
  const t = i18n.child.video;
  const answer = async (index: number) => {
    const error = await act({ type: "video-answer", id: video.id, answer: index });
    if (error === "wrong-answer") setWrong((w) => [...w, index]);
    else if (!error) setSolved(true);
  };
  return (
    <div
      className="flex flex-col gap-3 rounded-panel bg-card p-4 ring-1 ring-border"
      data-testid="video-quiz"
    >
      <h2 className="font-heading font-semibold text-lg">{t.question}</h2>
      <p>{video.question}</p>
      {solved ? (
        <>
          <p role="status" className="rounded-xl bg-gain-wash p-3 font-semibold text-sky">
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
              className={cn(
                primaryButton,
                "min-h-14 text-base",
                wrong.includes(index) && "opacity-30",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      {wrong.length > 0 && !solved && <p role="alert">{t.wrong}</p>}
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onClose} className={outlineButton}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t.child.video.close}
      </button>
    </div>
  );
}

// T-37: pause/play is the only control. No seeking, no "watch next". 1 s = 1 min in the demo.
function DemoPlayer({ video }: { video: ScienceVideo }) {
  const { act } = useLearning();
  const router = useRouter();
  const [position, setPosition] = useState(() => (video.solved ? 0 : video.position));
  const [playing, setPlaying] = useState(false);
  const saved = useRef(false);
  const { t: i18n } = useI18n();
  const t = i18n.child.video;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setPosition((p) => {
        const next = Math.min(p + 1, video.minutes);
        if (next >= video.minutes) setPlaying(false);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, video]);
  const finished = position >= video.minutes;
  useEffect(() => {
    if (finished && !saved.current) {
      saved.current = true;
      void act({ type: "video-position", id: video.id, position: video.minutes });
    }
  }, [finished, video, act]);
  const Icon = SCIENCE_ICONS[video.icon as keyof typeof SCIENCE_ICONS] ?? Play;
  const close = async () => {
    setPlaying(false);
    if (!finished) await act({ type: "video-position", id: video.id, position });
    router.push("/leisure");
  };
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <CloseButton onClose={close} />
      <h1 className="text-2xl">{video.title}</h1>
      <div
        className="relative grid aspect-video place-items-center overflow-hidden rounded-stage text-white"
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
              className="block h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
              style={{ width: `${(position / video.minutes) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            {position} / {i18n.child.leisure.minutes(video.minutes)}
          </p>
        </div>
      </div>
      {finished && <FinalQuiz video={video} />}
    </section>
  );
}

// Interactive film (docs/dev/films.md): real mp3 + script; position saved in whole minutes.
function FilmPlayer({ video }: { video: ScienceVideo }) {
  const { snapshot, act } = useLearning();
  const router = useRouter();
  const film = useFilmScript(video.id);
  const [finished, setFinished] = useState(() => !video.solved && video.position >= video.minutes);
  const [startAt] = useState(() => (video.solved ? 0 : video.position * 60));
  const seconds = useRef(startAt);
  const savedMinute = useRef(video.solved ? 0 : video.position);
  const lastSave = useRef(0);
  const { t: i18n } = useI18n();
  const t = i18n.child.video.film;

  const save = useCallback(
    (minute: number) => {
      if (minute === savedMinute.current) return;
      savedMinute.current = minute;
      void act({ type: "video-position", id: video.id, position: minute });
    },
    [act, video.id],
  );
  const onTime = useCallback(
    (now: number) => {
      seconds.current = now;
      if (Math.abs(now - lastSave.current) < SAVE_EVERY_SECONDS) return;
      lastSave.current = now;
      save(Math.min(Math.floor(now / 60), video.minutes - 1));
    },
    [save, video.minutes],
  );
  const onEnded = useCallback(() => {
    setFinished(true);
    savedMinute.current = video.minutes;
    void act({ type: "video-position", id: video.id, position: video.minutes });
  }, [act, video.id, video.minutes]);
  const close = async () => {
    if (!finished) {
      const minute = Math.min(Math.floor(seconds.current / 60), video.minutes - 1);
      if (minute !== savedMinute.current)
        await act({ type: "video-position", id: video.id, position: minute });
    }
    router.push("/leisure");
  };

  // The child's own Brainy leads the lecture: saved look and bought accessories.
  const stats = snapshot?.progress.stats;
  const equipped = snapshot?.showcase.equipped;
  const narrator = useMemo(
    () => (stats ? brainyNarrator(stats, equipped) : undefined),
    [stats, equipped],
  );

  if (!snapshot) return null;
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <CloseButton onClose={close} />
      <h1 className="text-2xl" lang={film.status === "ready" ? film.script.lang : undefined}>
        {video.title}
      </h1>
      {film.status === "loading" && (
        <p role="status" className="grid aspect-video place-items-center rounded-panel bg-card">
          {t.loading}
        </p>
      )}
      {film.status === "failed" && (
        <p role="alert" className="rounded-panel bg-card p-4 ring-1 ring-border">
          {t.failed}
        </p>
      )}
      {film.status === "ready" && !finished && (
        <FilmView
          script={film.script}
          src={film.script.audio}
          narrator={narrator}
          startAt={startAt}
          onTime={onTime}
          onEnded={onEnded}
        />
      )}
      {finished && <FinalQuiz video={video} />}
    </section>
  );
}

function Player({ id }: { id: string }) {
  const { snapshot } = useLearning();
  const video = snapshot?.showcase.science.find((v) => v.id === id);
  if (!video) return null;
  return hasFilm(id) ? <FilmPlayer video={video} /> : <DemoPlayer video={video} />;
}

export function VideoPlayer({ id }: { id: string }) {
  return (
    <LearningBoundary game>
      <Player id={id} />
    </LearningBoundary>
  );
}
