"use client";
import { Brainy } from "@brainee/brainy";
import { type StateSnapshot, stageOf } from "@brainee/core";
import { Dialog } from "@brainee/ui/components/dialog";
import { useEffect, useRef, useState } from "react";
import { primaryButton } from "@/components/demo/kit";
import { useI18n } from "@/i18n";

export function StageCelebration({
  snapshot,
  enabled,
}: {
  snapshot?: StateSnapshot;
  enabled: boolean;
}) {
  const previous = useRef<{
    child: string;
    stage: number;
    earned: string[];
  } | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const stage = snapshot ? stageOf(snapshot.progress.stats) : null;
  useEffect(() => {
    if (!snapshot) return;
    const stage = stageOf(snapshot.progress.stats);
    const prior = previous.current;
    if (enabled && prior?.child === snapshot.child.id && stage.index > prior.stage) setOpen(true);
    if (enabled && prior?.child === snapshot.child.id) {
      const earned = snapshot.showcase.earned.find((id) => !prior.earned.includes(id));
      if (earned) {
        setReward(earned);
        setOpen(true);
      }
    }
    previous.current = {
      child: snapshot.child.id,
      stage: stage.index,
      earned: snapshot.showcase.earned,
    };
  }, [snapshot, enabled]);
  if (!snapshot || !stage || !enabled) return null;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReward(null);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-foreground/30" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 overflow-auto rounded-panel border border-border bg-card p-6 text-center">
          <Dialog.Title className="font-heading font-bold text-2xl">
            {reward ? t.liveAnalytics.earned : t.stageUp.title}
          </Dialog.Title>
          <Brainy
            stats={snapshot.progress.stats}
            equipped={snapshot.showcase.equipped}
            className="h-48 w-48"
          />
          <p className="font-semibold">
            {reward ? t.child.brainyPage.earnedNames[reward] : t.stages[stage.id]}
          </p>
          <Dialog.Description>{t.stageUp.note}</Dialog.Description>
          <Dialog.Close className={primaryButton}>{t.stageUp.close}</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
