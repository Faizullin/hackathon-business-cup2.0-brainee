"use client";

import { Button } from "@brainee/ui/components/button";
import { useRouter } from "next/navigation";
import { type ReactNode, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import { useLearning } from "./LearningProvider";

export function StopLearningButton({
  href,
  children,
  variant = "secondary",
}: {
  href: "/brainy" | "/learn";
  children: ReactNode;
  variant?: "default" | "secondary" | "ghost";
}) {
  const { stop } = useLearning();
  const { t } = useI18n();
  const router = useRouter();
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function leave() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(false);
    try {
      await stop();
      router.push(href);
    } catch {
      setError(true);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <span className="flex flex-col gap-2">
      <Button variant={variant} size="child" disabled={busy} onClick={() => void leave()}>
        {busy ? t.child.sync.wait : children}
      </Button>
      {error && (
        <span role="alert" className="text-sm">
          {t.child.sync.stopError}
        </span>
      )}
    </span>
  );
}
