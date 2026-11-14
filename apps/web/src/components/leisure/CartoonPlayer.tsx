"use client";
import { Brainy } from "@brainee/brainy";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLearning } from "@/components/child/LearningProvider";
import { outlineButton, Panel, primaryButton } from "@/components/demo/kit";
import { ru } from "@/i18n/ru";
export function CartoonPlayer({ id }: { id: string }) {
  const { snapshot } = useLearning();
  const [position, setPosition] = useState(0),
    [playing, setPlaying] = useState(false);
  const cartoon = snapshot?.showcase.cartoons.find((c) => c.id === id),
    end = 12;
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
      <Panel as="h1" title={cartoon?.title ?? ru.cartoon.title} note={ru.cartoon.placeholder}>
        {cartoon?.owned ? (
          <>
            {position < end ? (
              <>
                <Brainy stats={snapshot.progress.stats} className="mx-auto h-56 w-auto" />
                <progress
                  aria-label={ru.cartoon.title}
                  value={position}
                  max={end}
                  className="w-full"
                />
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? ru.cartoon.pause : position ? ru.cartoon.play : ru.cartoon.begin}
                </button>
              </>
            ) : (
              <p role="status">{ru.cartoon.end}</p>
            )}
          </>
        ) : (
          <p>{ru.cartoon.locked}</p>
        )}
        <Link className={outlineButton} href="/learn">
          {ru.playTime.learn}
        </Link>
        <Link className={outlineButton} href="/leisure">
          {ru.playTime.leisure}
        </Link>
      </Panel>
    </div>
  );
}
