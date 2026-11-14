"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Brainy } from "@/components/Brainy";
import { useLearning } from "@/components/child/LearningProvider";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";

export function CartoonPlayer({ id }: { id: string }) {
  const { snapshot } = useLearning();
  const { t } = useI18n();
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const cartoon = snapshot?.showcase.cartoons.find((c) => c.id === id);
  const end = 12;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setPosition((p) => Math.min(end, p + 1)), 1000);
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (document.hidden) setPlaying(false);
    const hide = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  if (!snapshot) return null;
  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <Panel as="h1" title={cartoon?.title ?? t.cartoon.title} note={t.cartoon.placeholder}>
        {cartoon?.owned ? (
          position < end ? (
            <>
              <Brainy stats={snapshot.progress.stats} className="mx-auto h-56 w-auto" />
              <progress
                aria-label={t.cartoon.title}
                value={position}
                max={end}
                className="w-full"
              />
              <button type="button" className={primaryButton} onClick={() => setPlaying(!playing)}>
                {playing ? t.cartoon.pause : position ? t.cartoon.play : t.cartoon.begin}
              </button>
            </>
          ) : (
            <p role="status">{t.cartoon.end}</p>
          )
        ) : (
          <p>{t.cartoon.locked}</p>
        )}
        <Link className={outlineButton} href="/learn">
          {t.playTime.learn}
        </Link>
        <Link className={outlineButton} href="/leisure">
          {t.playTime.leisure}
        </Link>
      </Panel>
    </div>
  );
}
