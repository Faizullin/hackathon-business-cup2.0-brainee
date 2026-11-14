import { MotionProvider } from "@brainee/ui/motion-provider";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { LearningProvider } from "@/components/child/LearningProvider";
import { ru } from "@/i18n/ru";
import { onest, unbounded } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: ru.app.name, template: `%s · ${ru.app.name}` },
  description: ru.app.description,
  appleWebApp: { capable: true, title: ru.app.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f4fa" },
    { media: "(prefers-color-scheme: dark)", color: "#10121c" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${onest.variable} ${unbounded.variable}`}>
      <body>
        <MotionProvider>
          <LearningProvider>{children}</LearningProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
