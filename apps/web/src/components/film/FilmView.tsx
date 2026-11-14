"use client";

import { type FilmScript, filmCaptionAt, filmQuestionCrossed, filmSceneAt } from "@brainee/core";
import { type FilmNarrator, FilmStage } from "@brainee/films";
import { Pause, Play, RotateCcw } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { coralButton, outlineButton, primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";

type Meter = { ctx: AudioContext; analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> };

type FilmViewProps = {
  script: FilmScript;
  src: string;
  /** Who leads the film: the child's own Brainy in the app (see narrators.tsx). */
  narrator?: FilmNarrator;
  /** Seconds to resume from; questions before it count as answered. */
  startAt?: number;
  /** Lab only: seek bar, jump to questions, optional question skipping. */
  studio?: boolean;
  /** About once a second while playing, and on pause. */
  onTime?: (seconds: number) => void;
  onEnded?: () => void;
};

const PRAISE_MS = 1800;
export const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Plays a film: mp3 + script. The child can only pause; questions pause the audio. */
export function FilmView({
  script,
  src,
  narrator,
  startAt = 0,
  studio = false,
  onTime,
  onEnded,
}: FilmViewProps) {
  const { t: i18n } = useI18n();
  const t = i18n.child.video.film;
  const audio = useRef<HTMLAudioElement>(null);
  const last = useRef(startAt);
  const meter = useRef<Meter | null | false>(null); // false: Web Audio unavailable
  const praiseTimer = useRef<number | undefined>(undefined);
  const [time, setTime] = useState(startAt);
  const [playing, setPlaying] = useState(false);
  const [asking, setAsking] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const [praised, setPraised] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [talk, setTalk] = useState(0);
  const [skip, setSkip] = useState(false);
  const question = asking === null ? undefined : script.questions[asking];

  useEffect(() => () => window.clearTimeout(praiseTimer.current), []);
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    const place = () => {
      a.currentTime = startAt;
    };
    last.current = startAt;
    if (a.readyState >= 1) place();
    else a.addEventListener("loadedmetadata", place, { once: true });
    return () => a.removeEventListener("loadedmetadata", place);
  }, [startAt]);

  const seek = useCallback((to: number) => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = to;
    last.current = to;
    setTime(to);
  }, []);

  // Web Audio drives the mouth from the real voice level; created on the first tap (iOS).
  const ensureMeter = () => {
    if (meter.current !== null || !audio.current) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      meter.current = { ctx, analyser, data: new Uint8Array(new ArrayBuffer(analyser.fftSize)) };
    } catch {
      meter.current = false;
    }
  };

  const play = () => {
    const a = audio.current;
    if (!a) return;
    ensureMeter();
    if (meter.current) void meter.current.ctx.resume();
    a.play().then(
      () => setBlocked(false),
      () => setBlocked(true),
    );
  };

  useEffect(() => {
    if (!playing) {
      setTalk(0);
      return;
    }
    let frame = 0;
    let reported = -1;
    const tick = () => {
      const a = audio.current;
      if (!a) return;
      const now = a.currentTime;
      const crossed = skip ? undefined : filmQuestionCrossed(script, last.current, now);
      last.current = now;
      if (crossed !== undefined) {
        a.pause();
        setAsking(crossed);
        setWrong([]);
        setPraised(false);
      }
      const caption = filmCaptionAt(script, now);
      let level = 0;
      if (caption && caption.who !== "guest" && crossed === undefined) {
        const m = meter.current;
        if (m) {
          m.analyser.getByteTimeDomainData(m.data);
          let sum = 0;
          for (const v of m.data) sum += ((v - 128) / 128) ** 2;
          level = Math.min(1, Math.max(0, (Math.sqrt(sum / m.data.length) - 0.015) * 7));
        } else level = 0.35 + 0.35 * Math.sin(now * 18); // no Web Audio: talk on captions
      }
      setTalk(Math.round(level * 10) / 10);
      setTime(Math.round(now * 10) / 10);
      if (Math.floor(now) !== reported) {
        reported = Math.floor(now);
        onTime?.(now);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, script, skip, onTime]);

  const next = () => {
    window.clearTimeout(praiseTimer.current);
    setAsking(null);
    setPraised(false);
    setWrong([]);
    play();
  };
  const answer = (index: number) => {
    if (!question || praised) return;
    if (index !== question.answer) {
      setWrong((w) => (w.includes(index) ? w : [...w, index]));
      return;
    }
    setPraised(true);
    praiseTimer.current = window.setTimeout(next, PRAISE_MS);
  };
  const replay = () => {
    if (!question) return;
    seek(question.replayFrom);
    setAsking(null);
    setWrong([]);
    play();
  };

  const scene = filmSceneAt(script, time);
  const caption = filmCaptionAt(script, time);
  return (
    <div className="flex flex-col gap-3" data-testid="film" data-film={script.id}>
      <FilmStage
        scene={scene}
        caption={caption}
        talk={talk}
        playing={playing}
        narrator={narrator}
        className="w-full rounded-panel"
      />
      {/* biome-ignore lint/a11y/useMediaCaption: captions are drawn on the stage from the script */}
      <audio
        ref={audio}
        src={src}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          onTime?.(audio.current?.currentTime ?? 0);
        }}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
      />
      {question ? (
        <section
          aria-labelledby="film-question"
          className="flex flex-col gap-3 rounded-panel border border-border bg-card p-4"
          data-testid="film-question"
        >
          <p className="text-muted-foreground text-sm">{t.brainyAsks}</p>
          <h2 id="film-question" className="font-heading font-semibold text-lg" lang={script.lang}>
            {question.q}
          </h2>
          <div className="grid gap-2 sm:grid-cols-3" lang={script.lang}>
            {question.options.map((option, index) => (
              <button
                key={option}
                type="button"
                disabled={praised || wrong.includes(index)}
                onClick={() => answer(index)}
                className={cn(
                  coralButton,
                  "min-h-14 text-base",
                  wrong.includes(index) && "opacity-30",
                  praised && index === question.answer && "bg-mint",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {praised ? (
            <div className="flex flex-wrap items-center gap-3">
              <p
                role="status"
                className="flex-1 rounded-xl bg-mint/15 p-3 font-semibold"
                lang={script.lang}
              >
                {question.praise}
              </p>
              <button type="button" onClick={next} className={primaryButton}>
                {t.next}
              </button>
            </div>
          ) : (
            wrong.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <p role="alert" className="flex-1" lang={script.lang}>
                  {question.hint}
                </p>
                <button type="button" onClick={replay} className={outlineButton}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {t.listenAgain}
                </button>
              </div>
            )
          )}
        </section>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (playing ? audio.current?.pause() : play())}
            className={cn(primaryButton, "min-h-14 min-w-14")}
            aria-label={
              playing ? i18n.child.video.pause : blocked ? t.resume : i18n.child.video.play
            }
            data-testid="film-toggle"
          >
            {playing ? <Pause className="size-6" /> : <Play className="size-6" />}
          </button>
          <div className="flex-1">
            <div
              role="progressbar"
              aria-label={i18n.child.video.progress}
              aria-valuemin={0}
              aria-valuemax={Math.round(script.duration)}
              aria-valuenow={Math.round(time)}
              className="h-3 overflow-hidden rounded-full bg-line"
            >
              <span
                className="block h-full rounded-full bg-sky"
                style={{ width: `${(time / script.duration) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-muted-foreground text-sm">
              {t.time(clock(time), clock(script.duration))}
            </p>
          </div>
        </div>
      )}
      {studio && (
        <div className="flex flex-col gap-3 rounded-panel border border-border border-dashed p-3">
          <label className="flex flex-col gap-1 text-sm">
            {i18n.lab.film.seek}: {clock(time)}
            <input
              type="range"
              min={0}
              max={script.duration}
              step={0.1}
              value={time}
              onChange={(e) => seek(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} />
            {i18n.lab.film.skip}
          </label>
          <div className="flex flex-wrap gap-2">
            {script.questions.map((q, i) => (
              <button
                key={q.t}
                type="button"
                className={outlineButton}
                onClick={() => {
                  setAsking(null);
                  seek(Math.max(0, q.t - 4));
                }}
              >
                {i18n.lab.film.jump(i + 1, clock(q.t))}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
