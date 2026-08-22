"use client";

import { Star } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/ui/EmptyState";

export default function UpgradePage() {
  return (
    <AppShell title="Plans and billing">
      <ComingSoon
        icon={<Star className="size-6" />}
        title="Plans and billing"
        description="There is no billing in this build — every feature is enabled and the workspace is unlimited."
        bullets={["Seat-based plans and usage limits", "Payment and invoicing", "Storage and retention tiers"]}
      />
    </AppShell>
  );
}
