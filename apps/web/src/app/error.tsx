"use client";
import { Button } from "@brainee/ui/components/button";
import { useI18n } from "@/i18n";
export default function ErrorScreen({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center gap-4 p-6 text-center">
      <h1>{t.child.sync.title}</h1>
      <p role="alert">{t.child.sync.loadError}</p>
      <Button onClick={reset}>{t.child.sync.retry}</Button>
    </main>
  );
}
