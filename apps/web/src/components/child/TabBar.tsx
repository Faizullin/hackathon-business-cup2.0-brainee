"use client";

import { navigationCounts } from "@brainee/core";
import { ChildIcon, type ChildIconName } from "@brainee/ui/components/child-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationBadge } from "@/components/demo/NavigationBadge";
import { ru } from "@/i18n/ru";
import { useLearning } from "./LearningProvider";

const TABS: { href: string; icon: ChildIconName; label: string }[] = [
  { href: "/learn", icon: "learn", label: ru.child.tabs.learn },
  { href: "/leisure", icon: "leisure", label: ru.child.tabs.leisure },
  { href: "/gifts", icon: "gifts", label: ru.child.tabs.gifts },
  { href: "/brainy", icon: "brainy", label: ru.child.tabs.brainy },
];

// Persistent bar in the (child) layout: bottom on phones/portrait, a left rail at lg (iPad landscape).
export function TabBar() {
  const pathname = usePathname();
  const { snapshot } = useLearning();
  const count = snapshot ? navigationCounts(snapshot.showcase).childGifts : 0;
  return (
    <nav
      aria-label={ru.child.tabsLabel}
      className="fixed inset-x-0 bottom-0 z-20 border-border border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:inset-y-0 lg:right-auto lg:w-[calc(104px+env(safe-area-inset-left))] lg:border-t-0 lg:border-r lg:pt-[env(safe-area-inset-top)] lg:pl-[env(safe-area-inset-left)]"
    >
      <ul className="mx-auto grid max-w-[720px] grid-cols-4 lg:h-full lg:grid-cols-1 lg:content-center lg:gap-3">
        {TABS.map((tab) => {
          const current = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-description={
                  tab.href === "/gifts" && count ? ru.notifications(count) : undefined
                }
                aria-current={current ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold lg:min-h-20 lg:rounded-2xl lg:mx-2 transition-[color,transform] duration-(--dur-press) active:scale-95 ${
                  current ? "text-coral" : "text-muted-foreground"
                }`}
              >
                <ChildIcon name={tab.icon} className="size-7" />
                <span className="flex items-center gap-1">
                  {tab.label}
                  {tab.href === "/gifts" && <NavigationBadge count={count} />}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
