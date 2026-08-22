"use client";

import { Plug } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/ui/EmptyState";

const TARGETS = [
  "Zoom, Google Meet and Microsoft Teams — auto-join and record",
  "Google Calendar and Outlook — pull the invite, the roster and the agenda",
  "Slack — post notes into the channel when a meeting ends",
  "Salesforce and HubSpot — write call notes onto the opportunity",
  "Asana, Jira and Notion — push action items as real tasks",
];

export default function IntegrationsPage() {
  return (
    <AppShell title="Integrations">
      <ComingSoon
        icon={<Plug className="size-6" />}
        title="Integrations"
        description="Connecting to calendars, meeting platforms and downstream tools is deliberately out of scope for this build — transcripts come from seeded data or an upload instead."
        bullets={TARGETS}
      />
    </AppShell>
  );
}
