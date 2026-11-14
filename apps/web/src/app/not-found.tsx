"use client";

import { Card, CardDescription, CardFooter, CardHeader } from "@brainee/ui/components/card";
import { ArrowLeft } from "@brainee/ui/components/icons";
import { buttonVariants } from "@brainee/ui/lib/button-variants";
import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { useI18n } from "@/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <AppFrame>
      <main id="main-content" tabIndex={-1}>
        <Card>
          <CardHeader>
            <h1>{t.notFound.title}</h1>
            <CardDescription className="mt-1 text-base">{t.notFound.description}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/learn" className={buttonVariants()}>
              <ArrowLeft aria-hidden="true" />
              {t.app.toLearn}
            </Link>
          </CardFooter>
        </Card>
      </main>
    </AppFrame>
  );
}
