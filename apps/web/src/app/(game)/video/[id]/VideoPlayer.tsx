"use client";

import type { ScienceVideo } from "@brainee/core";
import { hasFilm } from "@brainee/films";
import { ArrowLeft } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { LearningBoundary } from "@/components/child/LearningBoundary";
import { useLearning } from "@/components/child/LearningProvider";
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
  if (!video || !hasFilm(id)) return null;
  return <FilmPlayer video={video} />;
}

export function VideoPlayer({ id }: { id: string }) {
  return (
    <LearningBoundary game>
      <Player id={id} />
    </LearningBoundary>
  );
}
