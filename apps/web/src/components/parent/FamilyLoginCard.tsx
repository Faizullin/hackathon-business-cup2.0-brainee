"use client";
import { useEffect, useState } from "react";
import { authCopy as copy } from "@/components/auth/copy";
import { outlineButton, Panel } from "@/components/demo/kit";
import { type FamilyLogin, forgetFamilyLogin, readFamilyLogin } from "@/lib/family-login";

export function FamilyLoginCard({
  prefix = "family-login",
  title = copy.loginTitle,
  email,
  childId,
}: {
  prefix?: string;
  title?: string;
  email?: string;
  childId?: string;
}) {
  const [login, setLogin] = useState<FamilyLogin | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const sync = () => setLogin(readFamilyLogin());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("family-login-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("family-login-changed", sync);
    };
  }, []);
  if (!login || (email && login.email !== email) || (childId && login.childId !== childId))
    return null;
  return (
    <Panel title={title} note={copy.loginNote}>
      <dl data-testid="family-login">
        {(["email", "password", "pin"] as const).map((k) => (
          <div key={k} className="flex flex-wrap gap-3">
            <dt>{copy[k]}</dt>
            <dd className="break-all font-mono" data-testid={`${prefix}-${k}`}>
              {login[k]}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={outlineButton}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${copy.email}: ${login.email}\n${copy.password}: ${login.password}\n${copy.pin}: ${login.pin}`,
              );
              setNotice(copy.copied);
            } catch {
              setNotice(copy.copyFailed);
            }
          }}
        >
          {copy.copy}
        </button>
        <button
          type="button"
          className={outlineButton}
          onClick={() => {
            forgetFamilyLogin();
            setLogin(null);
          }}
        >
          {copy.saved}
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
    </Panel>
  );
}
