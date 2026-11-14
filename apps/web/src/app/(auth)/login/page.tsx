import { Card, CardDescription, CardFooter, CardHeader } from "@brainee/ui/components/card";
import { ArrowRight } from "@brainee/ui/components/icons";
import { buttonVariants } from "@brainee/ui/lib/button-variants";
import type { Metadata } from "next";
import Link from "next/link";
import { ru } from "@/i18n/ru";
import { ParentLogin } from "./ParentLogin";

export const metadata: Metadata = { title: ru.login.title };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <Card>
        <CardHeader>
          <h1>{ru.login.title}</h1>
          <CardDescription className="mt-1 text-base">{ru.login.description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/learn" className={buttonVariants({ size: "child" })}>
            {ru.app.toLearn}
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/analytics" className={buttonVariants({ size: "child", variant: "outline" })}>
            {ru.child.mode.parent}
          </Link>
        </CardFooter>
      </Card>
      <ParentLogin />
    </div>
  );
}
