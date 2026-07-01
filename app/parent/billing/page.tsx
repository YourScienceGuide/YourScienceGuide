import type { Metadata } from "next";

import { BillingSection } from "@/components/parent/sections/billing";

export const metadata: Metadata = {
  title: "Parent · Subscription",
};

export default function ParentBillingPage() {
  return <BillingSection />;
}
