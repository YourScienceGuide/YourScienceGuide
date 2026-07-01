import type { Metadata } from "next";

import { NotificationsSection } from "@/components/parent/sections/notifications";

export const metadata: Metadata = {
  title: "Parent · Notifications",
};

export default function ParentNotificationsPage() {
  return <NotificationsSection />;
}
