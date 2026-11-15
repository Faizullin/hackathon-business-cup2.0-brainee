import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { forgetFamilyLogin, readFamilyLogin, saveFamilyLogin } from "./family-login";

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  });
  vi.stubGlobal("window", new EventTarget());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

it("retains a child's generated login until acknowledgment and notifies mounted cards", () => {
  const login = { email: "family@example.com", password: "sample", pin: "1234" };
  saveFamilyLogin(login, "child-a");
  expect(readFamilyLogin()).toEqual({ ...login, childId: "child-a" });
  expect(readFamilyLogin()).toEqual({ ...login, childId: "child-a" });
  const changed = vi.fn();
  window.addEventListener("family-login-changed", changed);
  forgetFamilyLogin();
  expect(readFamilyLogin()).toBeNull();
  expect(changed).toHaveBeenCalledOnce();
});
it("ignores malformed stored logins", () => {
  for (const value of ["{", "null", "{}", '{"email":4,"password":"x","pin":"1234"}']) {
    localStorage.setItem("brainee-family-login", value);
    expect(readFamilyLogin()).toBeNull();
  }
});
it("blocked storage does not prevent entry", () => {
  vi.stubGlobal("localStorage", {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
  });
  expect(() =>
    saveFamilyLogin({ email: "a", password: "b", pin: "1234" }, "child-a"),
  ).not.toThrow();
  expect(readFamilyLogin()).toBeNull();
  expect(forgetFamilyLogin).not.toThrow();
});
