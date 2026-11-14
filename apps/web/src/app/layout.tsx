import { MotionProvider } from "@brainee/ui/motion-provider";
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { LearningProvider } from "@/components/child/LearningProvider";
import { DEFAULT_LOCALE, I18nProvider, LOCALE_COOKIE, type Locale } from "@/i18n";
import { onest, unbounded } from "./fonts";
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
    { media: "(prefers-color-scheme: light)", color: "#f1f4fa" },
    { media: "(prefers-color-scheme: dark)", color: "#10121c" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  // BRAINEE_DEFAULT_LOCALE only lets the Russian-language test server change the fallback.
  const fallback: Locale = process.env.BRAINEE_DEFAULT_LOCALE === "ru" ? "ru" : DEFAULT_LOCALE;
  const initialLocale: Locale = rawLocale === "ru" || rawLocale === "en" ? rawLocale : fallback;

  return (
    <html lang={initialLocale} className={`${onest.variable} ${unbounded.variable}`}>
      <body>
        <I18nProvider initialLocale={initialLocale}>
          <MotionProvider>
            <LearningProvider>{children}</LearningProvider>
          </MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
