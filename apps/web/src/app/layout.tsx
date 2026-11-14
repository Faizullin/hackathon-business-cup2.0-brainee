import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ru } from "@/i18n/ru";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: ru.app.name,
    template: `%s · ${ru.app.name}`,
  },
  description: ru.app.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-10 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3"
        >
          {ru.app.skipToContent}
        </a>
        <div className="mx-auto w-full max-w-[1180px] pt-5 pr-[max(16px,env(safe-area-inset-right))] pb-[max(56px,env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))]">
          <header className="mb-6 border-line border-b pb-4">
            <p className="font-display text-xl font-bold text-coral">{ru.app.name}</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
