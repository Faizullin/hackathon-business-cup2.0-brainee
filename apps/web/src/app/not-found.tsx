import { Card, CardDescription, CardFooter, CardHeader } from "@brainee/ui/components/card";
import { ArrowLeft } from "@brainee/ui/components/icons";
import { buttonVariants } from "@brainee/ui/lib/button-variants";
import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { ru } from "@/i18n/ru";

export default function NotFound() {
  return (
    <AppFrame>
      <main id="main-content" tabIndex={-1}>
        <Card>
          <CardHeader>
            <h1>{ru.notFound.title}</h1>
            <CardDescription className="mt-1 text-base">{ru.notFound.description}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/learn" className={buttonVariants()}>
              <ArrowLeft aria-hidden="true" />
              {ru.app.toLearn}
            </Link>
          </CardFooter>
        </Card>
      </main>
    </AppFrame>
  );
}
