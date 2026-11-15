import { MotionProvider } from "@brainee/ui/motion-provider";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { LearningProvider } from "@/components/child/LearningProvider";
import { I18nProvider } from "@/i18n";
import { manrope, onest, unbounded } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Brainy", template: "%s · Brainy" },
  description: "Learn, play, and grow together with Brainy.",
  appleWebApp: { capable: true, title: "Brainy", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1fa" },
    { media: "(prefers-color-scheme: dark)", color: "#141226" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${onest.variable} ${unbounded.variable}`}>
      <body>
        <I18nProvider>
          <MotionProvider>
            <LearningProvider>{children}</LearningProvider>
          </MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
