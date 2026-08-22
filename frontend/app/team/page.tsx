"use client";

import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/ui/EmptyState";

export default function TeamPage() {
  return (
    <AppShell title="Team">
      <ComingSoon
        icon={<Users className="size-6" />}
        title="Team & sharing"
        description="This build assumes a single signed-in user, so there is no team directory, no per-meeting permissions and no shared channels."
        bullets={[
          "Invite teammates and manage roles",
          "Channels that meetings are filed into",
          "Per-meeting visibility and share links",
          "Comment mentions and notifications",
        ]}
      />
    </AppShell>
  );
}
