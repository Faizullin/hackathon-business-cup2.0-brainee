"use client";
import { BRAINY_PRESETS } from "@brainee/brainy";
import { Brainy } from "@/components/Brainy";
import { useI18n } from "@/i18n";
export function BrainyLoader() {
  const { t } = useI18n();
  return (
    <div role="status" className="flex flex-col items-center gap-3 p-6 text-center">
      <Brainy stats={BRAINY_PRESETS.afterQuiz} label="" className="brainy-idle h-28 w-28" />
      <p>{t.child.sync.loading}</p>
    </div>
  );
}
