import type { MetadataRoute } from "next";
import { ru } from "@/i18n/ru";

// T-60: installable app (Add to Home Screen). Every asset is served from our own origin.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: ru.app.name,
    short_name: ru.app.name,
    description: ru.app.description,
    lang: "ru",
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
