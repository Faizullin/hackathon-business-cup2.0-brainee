import { Lock } from "@brainee/ui/components/icons";
import { cn } from "@brainee/ui/lib/utils";
import Link from "next/link";
import { outlineButton } from "@/components/demo/kit";

// The way from a child device into parent mode. The parent pages ask for the PIN, so a child
// can open it but not use it; logout lives in parent Settings behind the same PIN.
export const PARENT_ENTRY_COPY = { label: "Parents", hint: "Parent mode needs the PIN" } as const;

export function ParentEntry() {
  return (
    <div className="flex justify-end">
      <Link
        href="/analytics"
        prefetch={false}
        aria-label={`${PARENT_ENTRY_COPY.label}. ${PARENT_ENTRY_COPY.hint}`}
        data-testid="parent-entry"
        className={cn(outlineButton, "min-h-9 rounded-full px-3 text-muted-foreground text-xs")}
      >
        <Lock aria-hidden="true" className="size-3.5" />
        {PARENT_ENTRY_COPY.label}
      </Link>
    </div>
  );
}
