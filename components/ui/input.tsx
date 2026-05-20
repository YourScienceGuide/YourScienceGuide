import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900",
        "placeholder:text-slate-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500",
        "dark:focus-visible:ring-stone-500 dark:focus-visible:ring-offset-stone-900",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
