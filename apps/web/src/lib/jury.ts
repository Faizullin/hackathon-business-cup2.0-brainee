import { saveFamilyLogin } from "./family-login";
import { requireAuthResponse } from "./use-auth-action";
/** Creates an isolated jury family, keeps its login for the chooser page and opens `/jury`. */
export async function enterJury() {
  const r = await fetch("/api/jury", { method: "POST" });
  requireAuthResponse(r);
  const data = await r.json();
  saveFamilyLogin(data.credentials, data.child.id);
  window.location.assign("/jury");
}
