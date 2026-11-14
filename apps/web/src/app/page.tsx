"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/AppFrame";
import { outlineButton, Panel } from "@/components/demo/kit";
import { JuryButton } from "@/components/JuryButton";
import { FloatingLocalePill } from "@/components/LocaleSwitcher";
import { useI18n } from "@/i18n";

export default function HomePage() {
  const { t } = useI18n();
  const [paired, setPaired] = useState(false);
  useEffect(() => {
    void fetch("/api/device")
      .then(async (r) => setPaired(r.ok && (await r.json()).paired))
      .catch(() => {});
  }, []);
  return (
    <AppFrame>
      <FloatingLocalePill />
      <main id="main-content" className="mx-auto max-w-2xl">
        <Panel as="h1" title={t.roles.title} note={t.roles.note}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link className={`${outlineButton} min-h-24`} href="/login">
              {t.roles.parent}
            </Link>
            <Link className={`${outlineButton} min-h-24`} href={paired ? "/entry" : "/child-login"}>
              {t.roles.child}
            </Link>
          </div>
          <JuryButton />
        </Panel>
      </main>
    </AppFrame>
  );
}
