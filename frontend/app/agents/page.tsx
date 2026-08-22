"use client";

import { Bot } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/ui/EmptyState";

export default function AgentsPage() {
  return (
    <AppShell title="Voice Agents">
      <ComingSoon
        icon={<Bot className="size-6" />}
        title="Voice Agents"
        description="A voice agent that joins calls on your behalf needs live audio capture and real-time speech-to-text, neither of which is part of this build."
        bullets={["Dial into a call as a participant", "Answer questions live from your knowledge base", "Hand off to a human when it is out of depth"]}
      />
    </AppShell>
  );
}
