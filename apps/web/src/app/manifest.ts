import type { MetadataRoute } from "next";
import { en } from "@/i18n/en";

// T-60: installable app (Add to Home Screen). Every asset is served from our own origin.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: en.app.name,
    short_name: en.app.name,
    description: en.app.description,
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f1f4fa",
    theme_color: "#f1f4fa",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
