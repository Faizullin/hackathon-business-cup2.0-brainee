"use client";

import { Card, CardDescription, CardFooter, CardHeader } from "@brainee/ui/components/card";
import { ArrowRight } from "@brainee/ui/components/icons";
import { buttonVariants } from "@brainee/ui/lib/button-variants";
import Link from "next/link";
import { useI18n } from "@/i18n";

export function LoginHeaderCard() {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <h1>{t.login.title}</h1>
        <CardDescription className="mt-1 text-base">{t.login.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Link href="/learn" className={buttonVariants({ size: "child" })}>
          {t.app.toLearn}
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/analytics" className={buttonVariants({ size: "child", variant: "outline" })}>
          {t.child.mode.parent}
        </Link>
      </CardFooter>
    </Card>
  );
}
