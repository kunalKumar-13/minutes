import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="flex size-12 items-center justify-center rounded-xl bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-500 dark:ring-white/10">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-base leading-6 text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** The "Coming Soon" panel used by every placeholder surface. */
export function ComingSoon({
  icon, title, description, bullets,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-e3">
        {icon}
      </div>
      <h2 className="mt-5 text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">{title}</h2>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700 ring-1 ring-inset ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/30">
        Coming soon
      </span>
      <p className="mt-4 text-md leading-6 text-gray-500 dark:text-gray-400">{description}</p>
      {bullets && (
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-left">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5 text-base text-gray-600 dark:text-gray-300">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-purple-400" />
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
