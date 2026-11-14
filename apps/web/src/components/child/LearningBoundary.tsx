"use client";

import { Button } from "@brainee/ui/components/button";
import { buttonVariants } from "@brainee/ui/lib/button-variants";
import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n";
import { LearningApiError, pendingGameHref } from "@/lib/learning-api";
import { useLearning } from "./LearningProvider";

export function LearningBoundary({
  children,
  game = false,
}: {
  children: ReactNode;
  game?: boolean;
}) {
  const { ready, error } = useLearning();
  const { t } = useI18n();
  const Container = game ? "section" : "main";
  if (!ready)
    return (
      <Container
        id={game ? undefined : "main-content"}
        className="mx-auto flex max-w-xl flex-col items-center gap-4 p-6 text-center"
      >
        <h1>{t.child.sync.title}</h1>
        <p role={error ? "alert" : "status"}>
          {error
            ? isExpired(error)
              ? t.child.sync.accessError
              : t.child.sync.loadError
            : t.child.sync.loading}
        </p>
        {error && <RetryStateButton />}
      </Container>
    );
  return (
    <>
      {!game && <LearningNotice />}
      {children}
    </>
  );
}

export function LearningNotice() {
  const { error, pending } = useLearning();
  const { t } = useI18n();
  if (!error && !pending) return null;
  return (
    <aside className="mx-auto flex max-w-xl flex-col items-center gap-3 p-4 text-center">
      {error && (
        <>
          <p role="alert">
            {isExpired(error) ? t.child.sync.accessError : t.child.sync.updateError}
          </p>
          <RetryStateButton />
        </>
      )}
      {pending && (
        <>
          <p>{t.child.sync.pending}</p>
          <Link
            href={pendingGameHref(pending.issued)}
            className={buttonVariants({ size: "child" })}
          >
            {t.child.sync.recover}
          </Link>
        </>
      )}
    </aside>
  );
}

const isExpired = (error: unknown) => error instanceof LearningApiError && error.status === 401;

function RetryStateButton() {
  const { error, refresh } = useLearning();
  const { t } = useI18n();
  const expired = isExpired(error);
  return (
    <Button
      size="child"
      onClick={() => {
        if (expired) window.location.reload();
        else void refresh().catch(() => {});
      }}
    >
      {expired ? t.child.sync.reload : t.child.sync.retry}
    </Button>
  );
}
