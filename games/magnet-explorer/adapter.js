// Exploration has lifecycle/exit only: no learning round, finish or reward API.
const gameId = "magnet-explorer";
const bridge = window.Brainee.connect({ contract: `${gameId}@1` });
await bridge.ready;
bridge.lifecycle("ready");
document.querySelector(".brainee-host-exit")?.addEventListener("click", () => {
  if (parent !== window) parent.postMessage({ type: "brainee:exit", gameId }, location.origin);
  else location.assign("/explore");
});
window.addEventListener("pagehide", () => bridge.close(), { once: true });
document.addEventListener(
  "click",
  (e) => {
    const link = e.target instanceof Element ? e.target.closest("a") : null;
    if (link && new URL(link.href, location.href).origin !== location.origin) e.preventDefault();
  },
  true,
);
