"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/AppFrame";
import { outlineButton, Panel } from "@/components/demo/kit";
import { JuryButton } from "@/components/JuryButton";
import { ru } from "@/i18n/ru";
export default function HomePage() {
  const [paired, setPaired] = useState(false);
  useEffect(() => {
    void fetch("/api/device")
      .then(async (r) => setPaired(r.ok && (await r.json()).paired))
      .catch(() => {});
  }, []);
  return (
    <AppFrame>
      <main id="main-content" className="mx-auto max-w-2xl">
        <Panel as="h1" title={ru.roles.title} note={ru.roles.note}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link className={`${outlineButton} min-h-24`} href="/login">
              {ru.roles.parent}
            </Link>
            <Link className={`${outlineButton} min-h-24`} href={paired ? "/entry" : "/child-login"}>
              {ru.roles.child}
            </Link>
          </div>
          <JuryButton />
        </Panel>
      </main>
    </AppFrame>
  );
}
