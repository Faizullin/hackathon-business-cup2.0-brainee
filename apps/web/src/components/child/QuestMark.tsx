import { Check } from "@brainee/ui/components/icons";
export function QuestMark({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-[26px] shrink-0 place-items-center rounded-[6px] ring-1 ${done ? "bg-primary text-white ring-primary" : "bg-violet-wash text-accent ring-border"}`}
    >
      {done && <Check className="size-4" />}
    </span>
  );
}
