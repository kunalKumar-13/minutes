"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { useSession, type Provider } from "@/components/layout/SessionProvider";
import { useToast } from "@/components/ui/Toast";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

/** Google's four-square mark, drawn inline so the button needs no network. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none" aria-hidden>
      <path d="M10.4 4.02C12.35 4.02 13.67 4.86 14.42 5.57L17.36 2.70C15.55 1.03 13.21 0 10.4 0 6.33 0 2.82 2.33 1.11 5.73l3.36 2.61c.85-2.51 3.18-4.32 5.93-4.32Z" fill="#EA4335" />
      <path d="M20.38 10.63c0-.85-.07-1.47-.22-2.12H10.4v3.86h5.73c-.11.96-.74 2.4-2.13 3.37l3.28 2.54c1.97-1.81 3.1-4.48 3.1-7.65Z" fill="#4285F4" />
      <path d="M4.48 12.46a6.4 6.4 0 0 1-.34-2.03c0-.71.13-1.4.33-2.03L1.11 5.73A10.4 10.4 0 0 0 0 10.43c0 1.68.4 3.27 1.11 4.7l3.37-2.67Z" fill="#FBBC05" />
      <path d="M10.4 20.86c2.81 0 5.17-.93 6.89-2.52l-3.28-2.54c-.88.61-2.06 1.04-3.61 1.04-2.75 0-5.09-1.81-5.92-4.32l-3.37 2.6c1.71 3.4 5.22 5.74 9.29 5.74Z" fill="#34A853" />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <rect width="7" height="7" fill="#F25022" />
      <rect x="9" width="7" height="7" fill="#7FBA00" />
      <rect y="9" width="7" height="7" fill="#00A4EF" />
      <rect x="9" y="9" width="7" height="7" fill="#FFB900" />
    </svg>
  );
}

function LoginPanel() {
  const { signIn } = useSession();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<Provider | null>(null);

  const go = async (provider: Provider) => {
    setBusy(provider);
    try {
      await signIn(provider);
    } catch {
      toast.error("Could not sign in", "Is the backend running?");
      setBusy(null);
    }
  };

  const next = searchParams.get("next");

  return (
    <div className="flex flex-col justify-center px-8 py-12 sm:px-14">
      <Logo size={44} className="rounded-xl" />

      <h1 className="mt-10 font-display text-4xl font-medium leading-10 text-gray-100">
        Get the #1 AI Assistant for
        <br />
        Your Meetings
      </h1>

      <p className="mt-8 max-w-md text-base leading-6 text-[#acaeb1]">
        By continuing you agree to our{" "}
        <Link href="/" className="text-[#d3d4d7] underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and acknowledge our{" "}
        <Link href="/" className="text-[#d3d4d7] underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>

      {next && (
        <p className="mt-4 rounded-md bg-white/[0.06] px-3 py-2 text-base text-[#acaeb1]">
          Sign in to continue to{" "}
          <span className="font-medium text-[#d3d4d7]">{next}</span>
        </p>
      )}

      <div className="mt-8 max-w-md space-y-3">
        {(
          [
            { key: "google", label: "Continue with Google", mark: <GoogleMark /> },
            { key: "microsoft", label: "Continue with Microsoft", mark: <MicrosoftMark /> },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            disabled={busy !== null}
            onClick={() => go(option.key)}
            className={cn(
              "group flex h-12 w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-[#232426] px-4",
              "text-base text-[#d3d4d7] transition-colors hover:bg-[#2b2c2f] disabled:opacity-60",
            )}
          >
            <span className="flex flex-1 items-center justify-center gap-3">
              {busy === option.key ? <Loader2 className="size-4 animate-spin" /> : option.mark}
              {option.label}
            </span>
            <ArrowRight className="size-4 shrink-0 text-[#8b8d91] transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => go("sso")}
          className="mx-auto block text-base text-[#d3d4d7] underline underline-offset-4 hover:text-white disabled:opacity-60"
        >
          Use Single Sign-On
        </button>
      </div>

      <p className="mt-10 flex items-center gap-2 text-sm text-[#6d6e71]">
        <Lock className="size-3.5 text-green-500" />
        <span className="tracking-wide">SOC 2 TYPE II · GDPR · HIPAA · 256-BIT ENCRYPTION</span>
      </p>

      <p className="mt-6 max-w-md rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-sm leading-5 text-[#8b8d91]">
        <span className="font-medium text-[#d3d4d7]">About this screen:</span> the assignment scopes real
        authentication as a placeholder, so no credential is checked — any option signs you into the demo workspace.
        The session itself is real: a token with an expiry that the API validates and you can revoke from Settings.
      </p>
    </div>
  );
}

/** The product teaser on the right of the real login screen. */
function Showcase() {
  return (
    <div className="relative hidden overflow-hidden border-l border-white/[0.06] lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_10%,rgba(122,90,248,0.22),transparent_60%)]" />

      <div className="relative flex h-full flex-col justify-between p-10">
        <div className="relative">
          {/* Soft four-colour bloom behind the card, as on the real screen. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 -top-8 h-40 rounded-full bg-ai-accent-soft opacity-25 blur-3xl"
          />
        <div className="relative rounded-xl border border-white/[0.06] bg-[#1a1b1e] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <p className="text-md font-medium text-[#d3d4d7]">Marketing Sync</p>
          <p className="mt-1 text-base text-[#6d6e71]">Jan 15, 11:30 AM</p>

          <p className="mt-5 flex items-center gap-2 text-base text-[#d3d4d7]">
            <span aria-hidden>🚀</span>
            Priorities:
            <span className="text-blue-400">00:00 – 10:12</span>
          </p>
          <ul className="mt-3 space-y-2">
            <li className="flex gap-2.5 text-base leading-6 text-[#acaeb1]">
              <span className="mt-2.5 size-1 shrink-0 rounded-full bg-[#6d6e71]" />
              Ensure clarity on messaging, target audience, and primary channels
            </li>
          </ul>
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded-full bg-white/[0.07]" />
            <div className="h-2 w-3/4 rounded-full bg-white/[0.07]" />
          </div>
          <span aria-hidden className="mt-5 block h-px w-28 bg-ai-accent" />
        </div>
        </div>

        <blockquote className="max-w-md">
          <p className="text-prose text-[#acaeb1]">
            “Every decision, every commitment, every number — searchable the moment the call ends.”
          </p>
          <footer className="mt-4 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
              AF
            </span>
            <span>
              <span className="block text-base font-medium text-[#d3d4d7]">From the seeded workspace</span>
              <span className="block text-base text-[#6d6e71]">A sample meeting, not a real quote</span>
            </span>
          </footer>
        </blockquote>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-[#0c0d0f] p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-[1320px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#131416] lg:grid-cols-2">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <Loader2 className="size-5 animate-spin text-[#6d6e71]" />
            </div>
          }
        >
          <LoginPanel />
        </Suspense>
        <Showcase />
      </div>
    </main>
  );
}
