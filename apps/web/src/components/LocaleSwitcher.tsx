"use client";

import { cn } from "@brainee/ui/lib/utils";
import { useI18n } from "@/i18n";

export function FloatingLocalePill({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <aside
      aria-label="Language selection"
      className={cn(
        "fixed top-4 right-4 z-30 flex items-center gap-1 rounded-full border border-border bg-card/90 p-1 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "rounded-full px-2.5 py-1 font-semibold text-xs transition-colors",
          locale === "en"
            ? "bg-violet-wash text-accent shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        🇬🇧 EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("ru")}
        aria-pressed={locale === "ru"}
        className={cn(
          "rounded-full px-2.5 py-1 font-semibold text-xs transition-colors",
          locale === "ru"
            ? "bg-violet-wash text-accent shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        🇷🇺 RU
      </button>
    </aside>
  );
}

export function HeaderLocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={cn(
        "flex items-center rounded-xl border border-border bg-secondary/50 p-1 font-semibold text-xs",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label="English"
        className={cn(
          "rounded-lg px-2 py-1 transition-colors",
          locale === "en"
            ? "bg-violet-wash text-accent shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("ru")}
        aria-pressed={locale === "ru"}
        aria-label="Русский"
        className={cn(
          "rounded-lg px-2 py-1 transition-colors",
          locale === "ru"
            ? "bg-violet-wash text-accent shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        RU
      </button>
    </div>
  );
}

export function LanguageRadioCards() {
  const { locale, setLocale, t } = useI18n();

  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">{t.settings.language}</legend>
      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left font-medium transition-all",
          locale === "en"
            ? "border-accent bg-violet-wash text-accent ring-2 ring-accent/20"
            : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-secondary/40",
        )}
      >
        <input
          type="radio"
          name="language_selection"
          value="en"
          checked={locale === "en"}
          onChange={() => setLocale("en")}
          className="sr-only"
        />
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border",
            locale === "en" ? "border-accent bg-accent" : "border-muted-foreground/40",
          )}
        >
          {locale === "en" && <span className="size-2 rounded-full bg-white" />}
        </span>
        <span className="font-semibold text-base text-foreground">🇬🇧 English (Default)</span>
      </label>

      <label
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left font-medium transition-all",
          locale === "ru"
            ? "border-accent bg-violet-wash text-accent ring-2 ring-accent/20"
            : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-secondary/40",
        )}
      >
        <input
          type="radio"
          name="language_selection"
          value="ru"
          checked={locale === "ru"}
          onChange={() => setLocale("ru")}
          className="sr-only"
        />
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border",
            locale === "ru" ? "border-accent bg-accent" : "border-muted-foreground/40",
          )}
        >
          {locale === "ru" && <span className="size-2 rounded-full bg-white" />}
        </span>
        <span className="font-semibold text-base text-foreground">🇷🇺 Русский</span>
      </label>
    </fieldset>
  );
}
