"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  DEFAULT_PARENT_SECTION,
  parentSectionPath,
  PARENT_BILLING_SECTION,
} from "@/lib/routes/parent";

export default function ParentIndexPage() {
  const router = useRouter();
  const { ready, hasLessonAccess } = useAuth();

  useEffect(() => {
    if (!ready) return;
    const section = hasLessonAccess
      ? DEFAULT_PARENT_SECTION
      : PARENT_BILLING_SECTION;
    router.replace(parentSectionPath(section));
  }, [ready, hasLessonAccess, router]);

  return (
    <p className="text-sm text-slate-500 dark:text-stone-500">
      Opening parent portal…
    </p>
  );
}
