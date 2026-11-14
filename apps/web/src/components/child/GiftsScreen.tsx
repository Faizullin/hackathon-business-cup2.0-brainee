"use client";

import { StarIcon, SunIcon } from "@brainee/ui/components/child-icons";
import { cn } from "@brainee/ui/lib/utils";
import {
  Chip,
  coralButton,
  Meter,
  Notice,
  outlineButton,
  Panel,
  primaryButton,
  useAct,
} from "@/components/demo/kit";
import { ru } from "@/i18n/ru";
import { useLearning } from "./LearningProvider";

// Child Gifts tab: weekly goal, parent's gift shop (☀ only), tasks from mom, ☀ → ★ exchange.
export function GiftsScreen() {
  const { snapshot } = useLearning();
  const { run, busy, notice } = useAct();
  if (!snapshot) return null;
  const { weekGoal, gifts, tasks } = snapshot.showcase;
  const { wallet } = snapshot.progress;
  const prize = gifts.find((g) => g.id === weekGoal.giftId)?.title ?? "";
  const t = ru.child.gifts;
  return (
    <>
      <Panel as="h1" title={t.title} note={t.description}>
        <div className="flex flex-col gap-2 rounded-xl bg-sun/15 p-4">
          <p className="font-heading font-semibold text-lg">{t.goal(weekGoal.target, prize)}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 font-semibold">
              {weekGoal.earned} / {weekGoal.target} <SunIcon className="size-4" />
            </span>
            <span className="text-muted-foreground">{t.goalDue(weekGoal.due)}</span>
          </div>
          <Meter value={(weekGoal.earned / weekGoal.target) * 100} tone="bg-sun" />
        </div>
      </Panel>
      <Notice notice={notice} />
      <Panel title={t.shop} note={`☀ ${wallet.suns}`}>
        <ul className="grid gap-3 lg:grid-cols-2">
          {gifts.map((gift) => (
            <li
              key={gift.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <span className="min-w-0">
                <span className="block font-semibold">{gift.title}</span>
                {gift.id === weekGoal.giftId && <Chip tone="sun">{t.goalMark}</Chip>}
              </span>
              <button
                type="button"
                disabled={busy || wallet.suns < gift.price}
                className={wallet.suns >= gift.price ? coralButton : outlineButton}
                onClick={() => run({ type: "buy-gift", giftId: gift.id }, t.bought(gift.title))}
              >
                {gift.price} <SunIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={t.tasks}>
        {tasks.length === 0 && (
          <p className="text-muted-foreground text-sm">{ru.parent.tasks.empty}</p>
        )}
        <ul className="grid gap-3 lg:grid-cols-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              data-testid={`child-task-${task.id}`}
              className={cn(
                "flex flex-col gap-2 rounded-xl border border-border p-3",
                task.status === "done" && "opacity-70",
              )}
            >
              <span className="font-semibold">{task.title}</span>
              <span className="flex flex-wrap items-center gap-2">
                <Chip>{task.skill}</Chip>
                <Chip tone={task.place === "real" ? "sun" : "sky"}>
                  +{task.reward} {task.place === "real" ? "☀" : "★"}
                </Chip>
                <Chip
                  tone={
                    task.status === "done" ? "mint" : task.status === "check" ? "sun" : undefined
                  }
                >
                  {ru.child.taskStatus[task.status]}
                </Chip>
                {task.status === "todo" &&
                  (task.place === "real" ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={cn(coralButton, "ml-auto")}
                      onClick={() => run({ type: "task-done", taskId: task.id })}
                    >
                      {t.done}
                    </button>
                  ) : (
                    <span className="ml-auto text-muted-foreground text-sm">{t.auto}</span>
                  ))}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title={t.exchange} note={t.exchangeNote}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1 font-semibold">
            <SunIcon className="size-5" /> {wallet.suns}
          </span>
          <button
            type="button"
            disabled={busy || wallet.suns < 1}
            className={primaryButton}
            onClick={() => run({ type: "exchange", suns: 1 })}
          >
            {t.exchangeAction}
          </button>
          <span className="flex items-center gap-1 font-semibold">
            <StarIcon className="size-5" /> {wallet.stars}
          </span>
        </div>
      </Panel>
    </>
  );
}
