"use client";

import { TASKS_PER_DAY, type TaskPlace } from "@brainee/core";
import { cn } from "@brainee/ui/lib/utils";
import { type FormEvent, useState } from "react";
import { useLearning } from "@/components/child/LearningProvider";
import {
  Chip,
  Meter,
  Notice,
  outlineButton,
  Panel,
  primaryButton,
  useAct,
} from "@/components/demo/kit";
import { useI18n } from "@/i18n";

const input = "min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base";

// T-44/T-45 for the demo: form, templates, Today list with confirm, limit 5, recommendations.
export function TasksScreen() {
  const { snapshot } = useLearning();
  const { run, busy, notice } = useAct();
  const { t: i18n } = useI18n();
  const t = i18n.parent.tasks;
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState<TaskPlace>("real");
  const [skill, setSkill] = useState("Ответственность");
  const [reward, setReward] = useState(2);
  if (!snapshot) return null;
  const { tasks, templates, recommendations, taskHistory = [] } = snapshot.showcase;
  const full = tasks.length >= TASKS_PER_DAY;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await run({ type: "task-add", title, place, skill, reward })) setTitle("");
  };
  return (
    <>
      <h1>{t.title}</h1>
      <Panel>
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold" data-testid="task-limit">
            {t.limit(tasks.length, TASKS_PER_DAY)}
          </span>
          <Chip tone="sky">{t.promise(snapshot.showcase.childPromise ?? 3)}</Chip>
        </div>
        <Meter value={(tasks.length / TASKS_PER_DAY) * 100} tone={full ? "bg-coral" : "bg-mint"} />
        <p className="text-muted-foreground text-xs">{t.limitNote}</p>
      </Panel>
      <Notice notice={notice} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t.today}>
          {tasks.length === 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">{t.empty}</p>
              <button
                type="button"
                className={outlineButton}
                onClick={() =>
                  document.getElementById("task-templates")?.scrollIntoView({ block: "center" })
                }
              >
                {t.chooseTemplate}
              </button>
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                data-testid={`parent-task-${task.id}`}
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
                    {i18n.child.taskStatus[task.status]}
                  </Chip>
                  {task.status === "todo" && (
                    <button
                      type="button"
                      disabled={busy}
                      className={cn(outlineButton, "ml-auto")}
                      onClick={() => run({ type: "task-cancel", taskId: task.id })}
                    >
                      {t.cancel}
                    </button>
                  )}
                  {task.status === "check" && (
                    <button
                      type="button"
                      disabled={busy}
                      className={cn(primaryButton, "ml-auto")}
                      onClick={() => run({ type: "task-confirm", taskId: task.id })}
                    >
                      {t.confirm}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title={t.form}>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium">
              {t.what}
              <input
                required
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={input}
              />
            </label>
            <fieldset className="flex flex-col gap-1 text-sm font-medium">
              <legend>{t.where}</legend>
              <div className="flex gap-2">
                {(["real", "app"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={place === value}
                    onClick={() => setPlace(value)}
                    className={cn(
                      outlineButton,
                      place === value && "border-foreground bg-secondary",
                    )}
                  >
                    {t[value]}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium">
                {t.skill}
                <input
                  required
                  maxLength={40}
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className={input}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium">
                {t.reward(place)}
                <input
                  type="number"
                  min={1}
                  max={place === "real" ? 20 : 100}
                  value={reward}
                  onChange={(e) => setReward(Number(e.target.value))}
                  className={input}
                />
              </label>
            </div>
            <button type="submit" disabled={busy || full} className={primaryButton}>
              {full ? t.limitReached : t.add}
            </button>
          </form>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm">
              <span id="task-templates">{t.templates}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => {
                    setTitle(template.title);
                    setSkill(template.skill);
                    setReward(template.reward);
                    setPlace("real");
                  }}
                  className={outlineButton}
                >
                  {template.title} · {template.reward}☀
                </button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">{t.tip}</p>
          </div>
        </Panel>
      </div>
      {taskHistory.length > 0 && (
        <Panel>
          <details data-testid="task-history">
            <summary className="cursor-pointer font-semibold">{t.history}</summary>
            <ul className="mt-3 flex flex-col gap-2">
              {taskHistory.map((task) => (
                <li
                  key={`${task.day}-${task.id}`}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 text-sm"
                >
                  <span className="flex-1">{task.title}</span>
                  <time dateTime={task.day} className="text-muted-foreground">
                    {i18n.date(task.day)}
                  </time>
                  <Chip>{task.status === "done" ? i18n.child.taskStatus.done : t.expired}</Chip>
                </li>
              ))}
            </ul>
          </details>
        </Panel>
      )}
      <Panel title={t.recs}>
        <ul className="grid gap-3 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <li key={rec.id} className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{rec.skill}</span>
                <span className="text-sm">
                  {rec.value}{" "}
                  <span className="text-muted-foreground text-xs">
                    · {t.recAverage(rec.average)}
                  </span>
                </span>
              </div>
              <Meter value={rec.value} tone="bg-coral" marker={rec.average} />
              <span className="self-start">
                <Chip>{rec.part}</Chip>
              </span>
              <p className="text-muted-foreground text-sm">{rec.why}</p>
              {rec.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg bg-secondary p-2 text-sm"
                >
                  <span className="flex-1">
                    {item.title}{" "}
                    <span className="text-muted-foreground">
                      · {item.duration} · {item.reward}☀
                    </span>
                  </span>
                  <button
                    type="button"
                    disabled={busy || full}
                    className={primaryButton}
                    onClick={() =>
                      run({
                        type: "recommendation-assign",
                        recommendationId: rec.id,
                        itemId: item.id,
                      })
                    }
                  >
                    {t.assign}
                  </button>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
