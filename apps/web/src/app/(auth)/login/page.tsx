import type { Metadata } from "next";
import { LoginHeaderCard } from "./LoginHeaderCard";
import { ParentLogin } from "./ParentLogin";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <LoginHeaderCard />
      <ParentLogin />
    </div>
  );
}
