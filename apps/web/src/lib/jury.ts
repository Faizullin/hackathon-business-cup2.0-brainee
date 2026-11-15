/** Creates an isolated jury family, keeps its login for the chooser page and opens `/jury`. */
export async function enterJury() {
  const r = await fetch("/api/jury", { method: "POST" });
  if (!r.ok) throw new Error("jury-failed");
  const data = await r.json();
  try {
    sessionStorage.setItem("brainee-jury", JSON.stringify(data.credentials));
  } catch {}
  window.location.assign("/jury");
}
