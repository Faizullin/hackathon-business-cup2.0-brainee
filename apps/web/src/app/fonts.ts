import localFont from "next/font/local";

// Vendored Google Fonts (OFL): packages/ui/src/fonts/SOURCES.txt.
export const onest = localFont({
  src: "../../../../packages/ui/src/fonts/Onest.woff2",
  variable: "--font-onest",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const unbounded = localFont({
  src: "../../../../packages/ui/src/fonts/Unbounded.woff2",
  variable: "--font-unbounded",
  weight: "200 900",
  style: "normal",
  display: "swap",
});
