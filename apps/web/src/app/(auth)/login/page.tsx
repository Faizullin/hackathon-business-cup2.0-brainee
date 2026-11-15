import type { Metadata } from "next";
import Link from "next/link";
import { authCopy } from "@/components/auth/copy";
import { outlineButton } from "@/components/demo/kit";
import { familySession } from "@/lib/server/device-session";
import { LoginHeaderCard } from "./LoginHeaderCard";
import { ParentLogin } from "./ParentLogin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await familySession();
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <LoginHeaderCard />
      {session && (
        <Link href="/entry" className={outlineButton}>
          {authCopy.continueAs(session.childName)}
        </Link>
      )}
      <ParentLogin />
    </div>
  );
}
