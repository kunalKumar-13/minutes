import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-5 bg-[var(--app-bg)] px-6 text-center">
      <Logo size={44} />
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Page not found
        </h1>
        <p className="mt-2 text-md text-gray-500 dark:text-gray-400">
          That meeting may have been deleted, or the link is wrong.
        </p>
      </div>
      <Link
        href="/notebook/mine-shared"
        className="inline-flex h-9 items-center rounded-md bg-purple-600 px-4 text-base font-medium text-white transition-colors hover:bg-purple-700"
      >
        Back to notebook
      </Link>
    </div>
  );
}
