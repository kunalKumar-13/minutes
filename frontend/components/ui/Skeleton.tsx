import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("ff-skeleton rounded-md", className)} />;
}

export function MeetingRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-[var(--app-border)] px-4 py-4">
      <Skeleton className="size-4 rounded" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function TranscriptSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {[0, 1, 2, 3, 4].map((index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-6 rounded-sm" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-10" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}
