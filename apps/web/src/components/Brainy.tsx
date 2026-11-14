"use client";
import { Brainy as Mascot } from "@brainee/brainy";
import type { ComponentProps } from "react";
import { useI18n } from "@/i18n";

/** UI callers inherit the active language; an explicit empty label remains decorative. */
export function Brainy(props: ComponentProps<typeof Mascot>) {
  const { t } = useI18n();
  return <Mascot {...props} label={props.label ?? t.child.tabs.brainy} />;
}
