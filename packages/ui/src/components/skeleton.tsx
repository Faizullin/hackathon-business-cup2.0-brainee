import { cn } from "@brainee/ui/lib/utils";
import type { ComponentProps } from "react";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

export { Skeleton };
