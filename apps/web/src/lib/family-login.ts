export type FamilyLogin = { email: string; password: string; pin: string; childId?: string };
const key = "brainee-family-login";
export function saveFamilyLogin(login: FamilyLogin, childId: string) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...login, childId }));
  } catch {}
}
export function readFamilyLogin(): FamilyLogin | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value && [value.email, value.password, value.pin].every((v) => typeof v === "string")
      ? value
      : null;
  } catch {
    return null;
  }
}
export function forgetFamilyLogin() {
  try {
    localStorage.removeItem(key);
    window.dispatchEvent(new Event("family-login-changed"));
  } catch {}
}
