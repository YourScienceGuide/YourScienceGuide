import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-stone-500",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-sky-600 text-white dark:bg-stone-100 dark:text-stone-900",
        secondary:
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200",
        outline:
          "border-sky-300 text-sky-800 dark:border-stone-600 dark:text-stone-300",
        preview:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
