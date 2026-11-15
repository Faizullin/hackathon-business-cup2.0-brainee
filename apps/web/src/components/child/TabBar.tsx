"use client";
import { navigationCounts, stageOf } from "@brainee/core";
import { ChildIcon, type ChildIconName } from "@brainee/ui/components/child-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brainy } from "@/components/Brainy";
import { NavigationBadge } from "@/components/demo/NavigationBadge";
import { useI18n } from "@/i18n";
import { useLearning } from "./LearningProvider";
import { childDesignCopy as copy } from "./redesign-copy";
export function TabBar() {
  const pathname = usePathname();
  const { snapshot } = useLearning();
  const { t } = useI18n();
  const count = snapshot ? navigationCounts(snapshot.showcase).childGifts : 0;
  const stage = snapshot ? stageOf(snapshot.progress.stats) : null;
  const tabs: { href: string; icon: ChildIconName; label: string }[] = [
    { href: "/learn", icon: "learn", label: t.child.tabs.learn },
    { href: "/leisure", icon: "leisure", label: t.child.tabs.leisure },
    { href: "/brainy", icon: "brainy", label: t.child.tabs.brainy },
    { href: "/path", icon: "path", label: copy.path },
    { href: "/gifts", icon: "gifts", label: t.child.tabs.gifts },
  ];
  return (
    <nav
      aria-label={t.child.tabsLabel}
      className="fixed inset-x-0 bottom-0 z-20 rounded-t-stage bg-card pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-14px_rgba(28,27,51,.22)] lg:inset-y-0 lg:right-auto lg:w-[calc(104px+env(safe-area-inset-left))] lg:rounded-none lg:pl-[env(safe-area-inset-left)]"
    >
      <ul className="mx-auto grid max-w-[720px] grid-cols-[1fr_1fr_92px_1fr_1fr] items-end px-1 lg:h-full lg:grid-cols-1 lg:content-center lg:gap-4">
        {tabs.map((tab) => {
          const current = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const hub = tab.href === "/brainy";
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-label={
                  hub && snapshot && stage
                    ? copy.hub(tab.label, snapshot.progress.mood, t.stages[stage.id])
                    : undefined
                }
                aria-description={
                  tab.href === "/gifts" && count ? t.notifications(count) : undefined
                }
                aria-current={current ? "page" : undefined}
                className={`lv-press relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-extrabold lg:min-h-20 ${current ? "text-mint" : "text-muted-foreground"}`}
              >
                {hub && snapshot && stage ? (
                  <span className="relative -mt-10 flex size-[84px] items-center justify-center rounded-full bg-card shadow-[0_0_0_6px_var(--surface),0_16px_30px_-12px_rgba(90,63,224,.55)] lg:mt-0">
                    <svg
                      viewBox="0 0 84 84"
                      aria-hidden="true"
                      className="absolute inset-0 size-full -rotate-90"
                    >
                      <circle
                        cx="42"
                        cy="42"
                        r="38"
                        fill="none"
                        stroke="var(--surface-2)"
                        strokeWidth="6"
                      />
                      <circle
                        className="lv-ring"
                        cx="42"
                        cy="42"
                        r="38"
                        fill="none"
                        stroke={stage.index === 4 ? "var(--pink)" : "var(--mint)"}
                        strokeWidth="6"
                        strokeLinecap="round"
                        pathLength="100"
                        strokeDasharray="100 100"
                        strokeDashoffset={100 - stage.progress * 100}
                      />
                    </svg>
                    <span className="flex size-[68px] items-center justify-center overflow-hidden rounded-full bg-[#FFF4F8]">
                      <Brainy
                        stats={snapshot.progress.stats}
                        mood={snapshot.progress.mood}
                        equipped={snapshot.showcase.equipped}
                        label=""
                        className="w-[78px] max-w-none"
                      />
                    </span>
                    <span className="absolute -right-1 bottom-0 rounded-full border-[3px] border-card bg-[#1C1B33] px-1.5 py-0.5 font-display text-[10px] text-white">
                      {snapshot.progress.mood}
                    </span>
                  </span>
                ) : (
                  <ChildIcon name={tab.icon} className="size-6" />
                )}
                <span className="flex items-center gap-1">
                  {tab.label}
                  {tab.href === "/gifts" && <NavigationBadge count={count} />}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-1 w-[18px] rounded-full ${current ? "bg-mint" : "bg-transparent"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
