// Unscored Exploration Host Adapter for Magnet Mission Lab
const gameId = "magnet-explorer";

// Connect to Brainee bridge if available
let bridge = null;
if (
  typeof window !== "undefined" &&
  window.Brainee &&
  typeof window.Brainee.connect === "function"
) {
  bridge = window.Brainee.connect({ contract: `${gameId}@1` });
  try {
    bridge.lifecycle("ready");
  } catch {}
}

// Easy host-controlled exit
const exitBtn = document.querySelector(".brainee-host-exit");
if (exitBtn) {
  exitBtn.addEventListener("click", () => {
    if (bridge) {
      try {
        bridge.call("session.exit");
      } catch {}
      try {
        bridge.lifecycle("exited");
      } catch {}
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "session.exit", gameId }, "*");
      window.parent.postMessage({ type: "brainee:exit", gameId }, "*");
    } else if (window.history.length > 1) {
      window.history.back();
    }
  });
}

// Disallow microphone
if (typeof navigator !== "undefined" && navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia = () =>
    Promise.reject(new Error("Microphone is not enabled for exploration preview."));
}

// Disallow external navigation
if (typeof document !== "undefined") {
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target;
      const link = target instanceof Element ? target.closest("a") : null;
      if (link?.href) {
        try {
          const url = new URL(link.href, location.href);
          if (url.origin !== location.origin) {
            e.preventDefault();
            e.stopPropagation();
          }
        } catch {}
      }
    },
    true,
  );
}

export { bridge };
