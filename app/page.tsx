import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-stone-50">
          Welcome
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-slate-600 dark:text-stone-400">
          Choose where you&apos;re learning today—your student courses or the
          parent portal.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/student">Go to student</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/parent">Parent portal</Link>
        </Button>
      </div>
    </div>
  );
}
