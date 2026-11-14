import { MotionProvider } from "@brainee/ui/motion-provider";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DemoProgressProvider } from "@/components/child/DemoProgressProvider";
import { ru } from "@/i18n/ru";
import { onest, unbounded } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: ru.app.name, template: `%s · ${ru.app.name}` },
  description: ru.app.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${onest.variable} ${unbounded.variable}`}>
      <body>
        <MotionProvider>
          <DemoProgressProvider>{children}</DemoProgressProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
