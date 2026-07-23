import { siteContainerClass } from "@/lib/layout";
import { cn } from "@/lib/utils";

const DISCLAIMER =
  "This publication is an independent, unofficial study guide. It is not affiliated with, endorsed by, or sponsored by Classical Academic Press or Novare Math and Science. Trademarks, product names, and logos used herein are the property of their respective owners.";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn(siteContainerClass, "pb-10 pt-4", className)}>
      <p className="border-t border-sky-100 pt-6 text-xs leading-relaxed text-slate-500 dark:border-stone-800 dark:text-stone-500">
        {DISCLAIMER}
      </p>
    </footer>
  );
}
