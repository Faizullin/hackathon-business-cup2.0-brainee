"use client";

import { CloudRain, Moon, Play, Sun } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { Panel, smallButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";
import { useLearning } from "./LearningProvider";

export const SCIENCE_ICONS = { sun: Sun, rain: CloudRain, moon: Moon };

/** Free interactive science films (D-33) on Learn: watch to the end, answer the question, +15★. */
export function FilmList() {
  const { snapshot } = useLearning();
  const { t: i18n } = useI18n();
  const t = i18n.child.leisure;
  if (!snapshot) return null;
  return (
    <Panel title={t.science} note={t.scienceNote}>
      <ul className="grid gap-3 sm:grid-cols-2" data-testid="film-list">
        {snapshot.showcase.science.map((video) => {
          const Icon = SCIENCE_ICONS[video.icon as keyof typeof SCIENCE_ICONS] ?? Play;
          return (
            <li key={video.id}>
              <Link
                href={`/video/${video.id}`}
                className="flex items-center gap-3 rounded-xl p-3 text-white transition-transform duration-(--dur-press) active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, var(--night), var(--accent))" }}
              >
                <Icon aria-hidden="true" className="size-10 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{video.title}</span>
                  <span className="text-sm opacity-90">
                    {video.solved
                      ? t.solved
                      : video.position > 0
                        ? t.resume(video.position)
                        : t.minutes(video.minutes)}
                  </span>
                </span>
                <span className={cn(smallButton, "bg-white/20")}>
                  <Play aria-hidden="true" className="size-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
