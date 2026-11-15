"use client";
import { BRAINY_PRESETS, Brainy } from "@brainee/brainy";
import { AnswerGroup } from "@brainee/ui/components/answer-group";
import { StepPage } from "@brainee/ui/components/step-page";
import { useState } from "react";
import { stepLabCopy as copy } from "./copy";
export default function StepLab() {
  const [value, setValue] = useState<string>();
  const [done, setDone] = useState(false);
  return (
    <StepPage
      step={done ? "done" : "choice"}
      total={{ current: done ? 2 : 1, count: 2 }}
      chapter={copy.chapter}
      title={done ? copy.done : copy.title}
      body={copy.body}
      backLabel={copy.back}
      continueLabel={copy.next}
      progressLabel={copy.progress}
      onBack={done ? () => setDone(false) : undefined}
      onContinue={done ? undefined : () => setDone(true)}
      disabled={!value}
      art={<Brainy stats={BRAINY_PRESETS.now} mood={72} className="h-36 w-auto lg:h-72" />}
    >
      {!done && (
        <AnswerGroup label={copy.title} options={copy.options} value={value} onChange={setValue} />
      )}
    </StepPage>
  );
}
