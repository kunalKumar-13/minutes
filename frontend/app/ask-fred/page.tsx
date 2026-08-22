"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CreateMeetingModal } from "@/components/meetings/CreateMeetingModal";

/**
 * AskFred has no page of its own — it is the panel pinned to the right of the
 * shell. This route simply opens the workspace with that panel showing, which
 * is what the rail's AskFred button is for.
 */
export default function AskFredPage() {
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <AppShell title="AskFred" askFred onCapture={() => setCreateOpen(true)}>
      <div className="mx-auto max-w-[640px] px-6 py-16 text-center">
        <h1 className="font-appDisplay text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
          Ask across every meeting
        </h1>
        <p className="mt-3 text-prose text-gray-500 dark:text-gray-400">
          Use the assistant on the right. Questions are matched against every transcript in the workspace, and each
          answer cites the lines it came from, so you can check it against what was actually said.
        </p>
        <p className="mt-6 text-base text-gray-400">
          On a narrow window the panel is hidden — widen the browser to bring it back.
        </p>
      </div>
      <CreateMeetingModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </AppShell>
  );
}
