"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ru } from "@/i18n/ru";

const LINKS = [
  { href: "/lab", label: ru.lab.nav.games },
  { href: "/lab/brainy", label: ru.lab.nav.brainy },
] as const;

export function LabNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={ru.lab.title} className="mt-4 flex gap-2">
      {LINKS.map((link) => {
        const current = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-12 items-center rounded-full px-4 font-semibold transition-colors duration-(--dur-press) ${
              current
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
