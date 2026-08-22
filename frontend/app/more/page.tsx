"use client";

import { MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/ui/EmptyState";

export default function MorePage() {
  return (
    <AppShell title="More">
      <ComingSoon
        icon={<MoreHorizontal className="size-6" />}
        title="More"
        description="The overflow menu in the real app collects workspace administration that this build does not implement."
        bullets={["Audit log", "Data export and retention", "Workspace-level defaults"]}
      />
    </AppShell>
  );
}
