"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  DEFAULT_SETTINGS_SECTION,
  settingsSectionPath,
} from "@/lib/routes/settings";

export default function SettingsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(settingsSectionPath(DEFAULT_SETTINGS_SECTION));
  }, [router]);

  return (
    <p className="text-sm text-slate-500 dark:text-stone-500">Opening settings…</p>
  );
}
