import { cva } from "class-variance-authority";

// Links share styles while retaining anchor semantics instead of button semantics.
export const buttonVariants = cva(
  "inline-flex shrink-0 touch-manipulation select-none items-center justify-center gap-2 rounded-xl border border-transparent bg-clip-padding px-4 py-3 text-sm font-semibold outline-none transition-[transform,background-color,color,opacity] duration-(--dur-press) ease-(--ease-out) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border-border bg-card text-card-foreground hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-foreground hover:bg-secondary",
        destructive: "bg-destructive/10 text-foreground hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-12 min-w-12",
        child: "min-h-14 min-w-14 px-5 text-base",
        icon: "size-12 p-3",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
