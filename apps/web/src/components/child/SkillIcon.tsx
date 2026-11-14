import {
  BookOpen,
  Brain,
  Crosshair,
  Hand,
  MessageCircle,
  Puzzle,
} from "@brainee/ui/components/icons";

const skills = {
  attention: { Icon: Crosshair, color: "bg-violet-wash text-mint" },
  logic: { Icon: Puzzle, color: "bg-gain-wash text-sky" },
  memory: { Icon: Brain, color: "bg-highlight-wash text-[#C24E7E]" },
  motor: { Icon: Hand, color: "bg-sun/15 text-ink" },
  speech: { Icon: MessageCircle, color: "bg-highlight-wash text-mint" },
  reading: { Icon: BookOpen, color: "bg-gain-wash text-mint" },
};
export function SkillIcon({ skill, large = false }: { skill: string; large?: boolean }) {
  const { Icon, color } = skills[skill as keyof typeof skills] ?? skills.logic;
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-row ${large ? "size-14" : "size-11"} ${color}`}
    >
      <Icon className={large ? "size-8" : "size-6"} />
    </span>
  );
}
