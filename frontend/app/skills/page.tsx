"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";

const APPS = [
  { name: "BANT App", description: "Extract budget, authority, need and timeline from a sales call.", tint: "bg-orange-400" },
  { name: "Churn Risk Analyzer", description: "Surface the signals that a customer is drifting away.", tint: "bg-pink-400" },
  { name: "Customer Objection Tracker", description: "List every objection or concern the customer raised.", tint: "bg-indigo-400" },
  { name: "Follow-Up Email Generator", description: "Draft the follow-up email for the deal, in your voice.", tint: "bg-cyan-400" },
  { name: "Interview Scorecard", description: "Score a candidate against the rubric your panel agreed on.", tint: "bg-purple-400" },
  { name: "Standup Digest", description: "Roll a week of standups into one status update.", tint: "bg-green-400" },
];

export default function AiAppsPage() {
  return (
    <AppShell title="AI Skills">
      <div className="mx-auto w-full max-w-[820px] px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
              AI Apps
            </h1>
            <p className="mt-1 text-md text-gray-500 dark:text-gray-400">
              Prompts that run over a transcript to produce a custom notes section.
            </p>
          </div>
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/30">
            Coming soon
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {APPS.map((app) => (
            <div
              key={app.name}
              className="ff-surface flex items-center gap-4 rounded-xl border p-4 opacity-90 transition-shadow hover:shadow-e2"
            >
              <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl text-white", app.tint)}>
                <Sparkles className="size-5 fill-current" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-md font-semibold text-gray-900 dark:text-gray-100">{app.name}</p>
                <p className="mt-0.5 text-base text-gray-500 dark:text-gray-400">{app.description}</p>
              </div>
              <Button size="sm" disabled title="AI Apps are not part of this build">
                Run
              </Button>
            </div>
          ))}

          <div className="ff-surface flex items-center gap-4 rounded-xl border border-dashed p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-green-500 dark:bg-white/5">
              <Sparkles className="size-5 fill-current" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-md font-semibold text-gray-900 dark:text-gray-100">Create new</p>
              <p className="mt-0.5 text-base text-gray-500 dark:text-gray-400">
                Write your own prompt to tailor meeting summaries.
              </p>
            </div>
            <Button size="sm" disabled>
              Create
            </Button>
          </div>
        </div>

        <p className="mt-6 rounded-lg bg-gray-50 p-4 text-base leading-6 text-gray-600 dark:bg-white/5 dark:text-gray-400">
          The notes engine that powers Overview, chapters and action items is real and runs on every meeting — see any
          meeting&apos;s notes panel. Custom per-app prompts are the part that isn&apos;t built.
        </p>
      </div>
    </AppShell>
  );
}
