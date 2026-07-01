"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { readLastAdminTab } from "@/lib/admin/admin-preferences";
import { adminTabPath, DEFAULT_ADMIN_TAB } from "@/lib/routes/admin";

export default function AdminIndexPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    const tab = user?.id ? readLastAdminTab(user.id) : DEFAULT_ADMIN_TAB;
    router.replace(adminTabPath(tab));
  }, [isLoaded, router, user?.id]);

  return (
    <p className="text-sm text-slate-500 dark:text-stone-500">Opening admin…</p>
  );
}
