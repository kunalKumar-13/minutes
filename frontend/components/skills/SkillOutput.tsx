"use client";

import { cn } from "@/lib/utils";
import type { SkillContent } from "@/lib/types";

/**
 * Tailwind can only see class names it can read in the source, so tints are a
 * static lookup rather than an interpolated `bg-${tint}-500`.
 */
export const TINTS: Record<string, string> = {
  orange: "bg-orange-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  cyan: "bg-cyan-500",
  purple: "bg-purple-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  sky: "bg-sky-500",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
};

export function tintClass(tint: string | undefined): string {
  return TINTS[tint ?? "indigo"] ?? TINTS.indigo;
}

/** Bold spans, inline. The generator only ever emits `**…**`. */
function inline(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${index}`} className="font-semibold text-gray-900 dark:text-gray-100">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${index}`}>{part}</span>
    ),
  );
}

/**
 * A deliberately small renderer for the subset of markdown the skills engine
 * produces — headings, bold section labels and bullets. Pulling in a full
 * markdown library to render six shapes we generate ourselves would be a
 * dependency with no upside.
 */
export function SkillBody({ body, className }: { body: string; className?: string }) {
  const lines = body.split("\n");
  return (
    <div className={cn("space-y-1.5 text-base leading-6 text-gray-600 dark:text-gray-300", className)}>
      {lines.map((line, index) => {
        const key = `line-${index}`;
        const trimmed = line.trim();

        if (!trimmed) return <div key={key} className="h-1.5" />;

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={key} className="pt-1 text-md font-semibold text-gray-900 dark:text-gray-100">
              {trimmed.slice(4)}
            </h3>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <div key={key} className="flex gap-2 pl-0.5">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600" />
              <p className="min-w-0 flex-1">{inline(trimmed.slice(2), key)}</p>
            </div>
          );
        }

        return <p key={key}>{inline(trimmed, key)}</p>;
      })}
    </div>
  );
}

/** Horizontal share bars for a chart skill. */
export function SkillChartView({ chart }: { chart: NonNullable<SkillContent["chart"]> }) {
  const max = Math.max(...chart.values, 1);
  return (
    <div className="mt-3 space-y-2">
      {chart.labels.map((label, index) => (
        <div key={label} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-base text-gray-600 dark:text-gray-300">{label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
            <span
              className="block h-full rounded-full bg-indigo-500"
              style={{ width: `${Math.round((chart.values[index] / max) * 100)}%` }}
            />
          </span>
          <span className="tabular-nums text-sm text-gray-500 dark:text-gray-400">{chart.shares[index]}%</span>
        </div>
      ))}
    </div>
  );
}

/** Body plus chart — the one place that decides how a run renders. */
export function SkillOutput({ content, className }: { content: SkillContent; className?: string }) {
  if (!content?.body && !content?.chart) {
    return <p className="text-base italic text-gray-500 dark:text-gray-400">This run produced no output.</p>;
  }
  return (
    <div className={className}>
      {content.body ? <SkillBody body={content.body} /> : null}
      {content.chart ? <SkillChartView chart={content.chart} /> : null}
    </div>
  );
}
