"use client";

import { CalendarClock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/ui/EmptyState";

export default function LivePage() {
  return (
    <AppShell title="Meeting Status">
      <ComingSoon
        icon={<CalendarClock className="size-6" />}
        title="Live notetaker"
        description="A bot that dials into a call, records it and transcribes in real time needs live speech-to-text, which this build does not do."
        bullets={[
          "Auto-join meetings from your connected calendar",
          "Live transcription with speaker diarisation",
          "In-call soundbites and starred moments",
          "Notes delivered before the call has ended",
        ]}
      />
    </AppShell>
  );
}
