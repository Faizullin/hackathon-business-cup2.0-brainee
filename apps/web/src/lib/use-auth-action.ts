"use client";
import { useCallback, useRef, useState } from "react";

export type AuthErrorKind = "invalid" | "conflict" | "wrong" | "unavailable" | "network";
export class AuthActionError extends Error {
  constructor(public readonly kind: AuthErrorKind) {
    super(kind);
  }
}
export function requireAuthResponse(response: Response) {
  if (!response.ok)
    throw new AuthActionError(
      response.status === 409
        ? "conflict"
        : response.status === 400 || response.status === 422
          ? "invalid"
          : response.status === 401 || response.status === 403
            ? "wrong"
            : "unavailable",
    );
  return response;
}

/** One in-flight action per surface, including submissions before React renders. */
export function useAuthAction() {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const run = useCallback(async <T>(action: () => Promise<T>): Promise<T | undefined> => {
    if (locked.current) return undefined;
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      return await action();
    } catch (cause) {
      setError(cause instanceof AuthActionError ? cause.kind : "network");
    } finally {
      locked.current = false;
      setPending(false);
    }
  }, []);
  return { pending, error, run };
}
