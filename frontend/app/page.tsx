"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, BarChart3, Bot, Check, ChevronDown, Crosshair, Globe,
  Lock, Menu, Scissors, Search, Sparkles, Star, Upload, Users, X, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const NAV = ["Product", "Solutions", "Integration", "Resources"];

const TRANSCRIPTION_FACTS = [
  { icon: <Crosshair className="size-4" />, title: "95% accurate", body: "Speaker-attributed transcripts you can actually quote from." },
  { icon: <Globe className="size-4" />, title: "100+ languages", body: "English, Spanish, French, Hindi and many more." },
  { icon: <Users className="size-4" />, title: "Speaker recognition", body: "Every line attributed, and renameable in one click." },
  { icon: <Zap className="size-4" />, title: "Auto language detection", body: "Switch between languages meeting to meeting." },
];

const CAPTURE_WAYS = [
  { icon: <Bot className="size-4" />, title: "Notetaker bot", body: "Invite the bot to a call, or let it auto-join from your calendar.", tint: "bg-purple-50 dark:bg-purple-500/10" },
  { icon: <Upload className="size-4" />, title: "Upload a recording", body: "Drop in a .txt, .vtt, .srt or .json transcript and it is parsed instantly.", tint: "bg-yellow-50 dark:bg-yellow-500/10" },
  { icon: <Sparkles className="size-4" />, title: "Paste anything", body: "Even an untimed wall of text gets speakers and a working timeline.", tint: "bg-teal-50 dark:bg-teal-500/10" },
];

const FAQS = [
  {
    q: "Is this the real Fireflies.ai?",
    a: "No. It is an independent clone built as an engineering assignment, to reproduce the product's design and its post-meeting workflows. It is not affiliated with Fireflies.ai.",
  },
  {
    q: "Does it actually transcribe audio?",
    a: "No — speech-to-text is deliberately out of scope. Meetings start from a transcript you already have: seeded samples, a pasted block of text, or an uploaded .txt / .vtt / .srt / .json file.",
  },
  {
    q: "Where do the AI summaries come from?",
    a: "A deterministic extractive summariser built into the backend: it scores sentences by keyword density and position, splits the meeting into chapters, and pulls out commitments using a small grammar of who-owes-what. Point it at an Anthropic key and Claude writes them instead.",
  },
  {
    q: "Is my data stored anywhere?",
    a: "Everything lives in a single SQLite database beside the API. There is no third-party analytics, and no transcript leaves the server unless you configure an LLM key yourself.",
  },
];

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl", className)}>
      {children}
    </h2>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-dvh bg-white font-sans text-gray-900">
      {/* ---------------------------------------------------------- top bar */}
      <div className="flex h-10 items-center justify-center gap-2 bg-purple-500 px-4 text-center text-white">
        <span className="rounded bg-green-300 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-green-900">
          New
        </span>
        <p className="truncate text-base">Interactive transcripts, AI notes and workspace-wide search.</p>
        <Link href="/login" className="hidden shrink-0 underline underline-offset-2 sm:inline">
          See now
        </Link>
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#100730]">
        <nav className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-8 px-5" aria-label="Main">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Logo size={26} />
            <span className="font-display text-lg font-medium text-white">fireflies.ai</span>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <span
                key={item}
                className="flex cursor-default items-center gap-1 text-base font-medium text-gray-200"
              >
                {item}
                <ChevronDown className="size-3.5 text-gray-400" />
              </span>
            ))}
            <span className="cursor-default text-base font-medium text-gray-200">Enterprise</span>
            <span className="cursor-default text-base font-medium text-gray-200">Pricing</span>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-lg border border-white/20 px-4 text-base font-medium text-white transition-colors hover:bg-white/10 sm:inline-flex"
            >
              Request demo
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg bg-purple-500 px-4 text-base font-medium text-white transition-colors hover:bg-purple-600"
            >
              Open app
            </Link>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-md p-2 text-white lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="border-t border-white/10 px-5 py-4 lg:hidden">
            {[...NAV, "Enterprise", "Pricing"].map((item) => (
              <span key={item} className="block py-2 text-base text-gray-200">
                {item}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-[#100730] pb-40 pt-24 text-center">
        {/* A faint starfield, drawn rather than fetched. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 12% 22%, rgba(255,255,255,.5), transparent), radial-gradient(1px 1px at 78% 14%, rgba(255,255,255,.4), transparent), radial-gradient(1.5px 1.5px at 43% 62%, rgba(255,255,255,.35), transparent), radial-gradient(1px 1px at 88% 68%, rgba(255,255,255,.4), transparent), radial-gradient(1px 1px at 25% 82%, rgba(255,255,255,.3), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-[1000px] px-5">
          <h1 className="font-display text-[42px] font-medium leading-[1.15] tracking-[0.02em] text-gray-50 sm:text-6xl">
            The #1 AI Assistant For
            <br />
            Your Meetings
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-gray-300">
            Transcribe, summarize, search, and analyze all your team conversations.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-cta-purple px-6 text-md font-medium text-white shadow-e2 transition-opacity hover:opacity-90"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#how"
              className="inline-flex h-12 items-center rounded-lg border border-white/15 bg-white/5 px-6 text-md font-medium text-white transition-colors hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>

          <div className="mx-auto mt-12 inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-xl bg-white/[0.06] px-5 py-3 text-base text-gray-200">
            <span className="inline-flex items-center gap-1.5">
              Rated 4.8 / 5
              <span className="flex" aria-hidden>
                {[0, 1, 2, 3, 4].map((index) => (
                  <Star key={index} className={cn("size-3.5", index < 4 ? "fill-yellow-400 text-yellow-400" : "fill-yellow-400/40 text-yellow-400/40")} />
                ))}
              </span>
            </span>
            <span className="hidden h-4 w-px bg-white/20 sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <Lock className="size-3.5 text-green-400" />
              GDPR, SOC 2 and more
            </span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- transcription */}
      <section id="how" className="bg-gray-25 py-24">
        <div className="mx-auto grid max-w-[1140px] items-center gap-14 px-5 lg:grid-cols-2">
          <div>
            <SectionHeading>
              High quality meeting
              <br />
              <span className="text-purple-600">transcription</span> &amp;{" "}
              <span className="text-purple-600">recording</span>
            </SectionHeading>

            <Link
              href="/login"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-cta-purple px-5 text-base font-medium text-white shadow-e2 transition-opacity hover:opacity-90"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>

            <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {TRANSCRIPTION_FACTS.map((fact) => (
                <div key={fact.title}>
                  <span className="text-gray-900">{fact.icon}</span>
                  <dt className="mt-3 text-md font-medium text-gray-900">{fact.title}</dt>
                  <dd className="mt-1 text-base leading-6 text-gray-500">{fact.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <TranscriptMock />
        </div>
      </section>

      {/* ---------------------------------------------------- AI summaries */}
      <section className="bg-[#100730] py-24 text-white">
        <div className="mx-auto max-w-[1140px] px-5">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <SectionHeading className="text-white">
                Comprehensive <span className="text-purple-400">AI summaries</span>
              </SectionHeading>
              <p className="mt-4 text-md leading-7 text-gray-300">
                An overview, timestamped chapters, action items attributed to whoever committed to them, and the
                decisions the meeting actually reached.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-purple-500 px-5 text-base font-medium text-white transition-colors hover:bg-purple-600"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <NotesMock />
        </div>
      </section>

      {/* --------------------------------------------------------- capture */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-[1140px] px-5 text-center">
          <SectionHeading>
            <span className="text-purple-600">Capture</span> meetings{" "}
            <span className="text-purple-600">anywhere</span> &amp; anytime
          </SectionHeading>

          <div className="mt-12 grid gap-4 text-left md:grid-cols-3">
            {CAPTURE_WAYS.map((way) => (
              <div key={way.title} className={cn("rounded-2xl p-6", way.tint)}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-white text-purple-600 shadow-e1 dark:bg-ink-500">
                  {way.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{way.title}</h3>
                <p className="mt-1.5 text-base leading-6 text-gray-600">{way.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- search */}
      <section className="bg-gray-25 py-24">
        <div className="mx-auto grid max-w-[1140px] items-center gap-14 px-5 lg:grid-cols-2">
          <div>
            <SectionHeading>
              Remember every conversation with{" "}
              <span className="text-purple-600">AI powered search</span>
            </SectionHeading>
            <p className="mt-4 text-md leading-7 text-gray-600">
              One query across every transcript, meeting title and action item — ranked by a real full-text index,
              not a substring scan. Ask a question and get an answer that cites the lines it came from.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Full-text search with relevance ranking",
                "Highlighted matches with prev/next stepping",
                "Filter by participant, channel or date",
                "Answers grounded in cited transcript lines",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-base text-gray-700">
                  <Check className="mt-1 size-4 shrink-0 text-purple-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <SearchMock />
        </div>
      </section>

      {/* ------------------------------------------------------- analytics */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-[1140px] px-5">
          <SectionHeading className="max-w-2xl">
            Drive insights with <span className="text-purple-600">conversation intelligence</span>
          </SectionHeading>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <BarChart3 className="size-4" />, title: "Talk time", body: "Who dominated, and who never got a word in." },
              { icon: <Sparkles className="size-4" />, title: "Topics", body: "What this workspace actually spends its time on." },
              { icon: <Scissors className="size-4" />, title: "Soundbites", body: "Clip the moment that mattered and keep it." },
              { icon: <Search className="size-4" />, title: "Trends", body: "Meeting volume and follow-through over time." },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-gray-200 p-6">
                <span className="flex size-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  {card.icon}
                </span>
                <h3 className="mt-4 text-md font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-1.5 text-base leading-6 text-gray-500">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- FAQ */}
      <section className="bg-gray-25 py-24">
        <div className="mx-auto max-w-[820px] px-5">
          <SectionHeading className="text-center">Frequently asked questions</SectionHeading>

          <dl className="mt-12 divide-y divide-gray-100 border-y border-gray-200">
            {FAQS.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={faq.q}>
                  <dt>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    >
                      <span className="text-md font-medium text-gray-900">{faq.q}</span>
                      <ChevronDown className={cn("size-5 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
                    </button>
                  </dt>
                  {open && <dd className="pb-5 pr-10 text-base leading-7 text-gray-600">{faq.a}</dd>}
                </div>
              );
            })}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="bg-[#100730] py-20 text-center text-white">
        <div className="mx-auto max-w-[760px] px-5">
          <SectionHeading className="text-white">
            Unlock the knowledge buried inside your conversations
          </SectionHeading>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-cta-purple px-6 text-md font-medium text-white shadow-e2 transition-opacity hover:opacity-90"
          >
            Get started free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* -------------------------------------------------------------- mockups */

function BrowserFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white shadow-e4", className)}>
      {children}
    </div>
  );
}

function TranscriptMock() {
  const lines = [
    { name: "Cate", color: "bg-red-400", time: "00:53", text: "There's some concern about onboarding. Clients feel it's not intuitive enough." },
    { name: "Rohan", color: "bg-orange-400", time: "01:24", text: "Noted. We'll pass that to product. On the seating front, how are we doing with capacity?" },
    { name: "Tom", color: "bg-pink-400", time: "01:47", text: "We have room for another forty seats before we need to renegotiate." },
  ];
  return (
    <BrowserFrame>
      <p className="border-b border-gray-200 px-5 py-4 text-lg font-semibold text-gray-900">Transcript</p>
      <div className="p-4">
        <div className="flex h-10 items-center gap-2 rounded-lg bg-gray-50 px-3 text-base text-gray-400">
          <Search className="size-4" />
          Search
        </div>
        <div className="mt-4 space-y-5">
          {lines.map((line) => (
            <div key={line.time}>
              <div className="flex items-center gap-2">
                <span className={cn("flex size-7 items-center justify-center rounded-sm text-[11px] font-semibold text-white", line.color)}>
                  {line.name[0]}
                </span>
                <span className="text-md font-medium text-gray-900">{line.name}</span>
                <ChevronDown className="size-3.5 text-gray-400" />
                <span className="text-gray-300">·</span>
                <span className="text-base font-medium tabular-nums text-blue-700 underline decoration-blue-300 underline-offset-2">
                  {line.time}
                </span>
              </div>
              <p className="mt-1 pl-9 text-md leading-7 text-gray-700">{line.text}</p>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function NotesMock() {
  return (
    <BrowserFrame className="mt-12">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <span className="text-base text-gray-500"># Sales</span>
        <span className="text-gray-300">/</span>
        <span className="text-base font-medium text-gray-900">Kickoff Call</span>
        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-2xs font-bold uppercase text-teal-700">Rec</span>
        <span className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-purple-600 px-3 text-base font-medium text-white">
          <Globe className="size-3.5" />
          Share
        </span>
      </div>

      <div className="p-6 text-left">
        <p className="text-lg font-semibold text-gray-900">Action Items</p>

        <p className="mt-4 text-base text-gray-500">Chris</p>
        <ul className="mt-1.5 space-y-1.5">
          {[
            ["Prepare technical requirements for setting up integrations.", "01:47"],
            ["Provide a final list of 50 users for initial training by Thursday.", "24:42"],
          ].map(([text, time]) => (
            <li key={time} className="flex gap-3">
              <span className="mt-2.5 size-1 shrink-0 rounded-full bg-gray-400" />
              <span className="text-md leading-7 text-gray-700">
                {text} <span className="tabular-nums text-blue-700">{time}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-base text-gray-500">Sarah</p>
        <ul className="mt-1.5 space-y-1.5">
          <li className="flex gap-3">
            <span className="mt-2.5 size-1 shrink-0 rounded-full bg-gray-400" />
            <span className="text-md leading-7 text-gray-700">
              Schedule training sessions for the team, with weekly feedback calls.{" "}
              <span className="tabular-nums text-blue-700">02:19</span>
            </span>
          </li>
        </ul>
      </div>
    </BrowserFrame>
  );
}

function SearchMock() {
  return (
    <BrowserFrame>
      <div className="p-5">
        <div className="flex h-11 items-center gap-2 rounded-lg border border-purple-200 bg-white px-3 text-md text-gray-900 ring-4 ring-purple-100">
          <Search className="size-4 text-gray-400" />
          renewal
        </div>
        <div className="mt-4 space-y-3">
          {[
            ["Marguerite Dubois", "05:22", "I'm not trying to be adversarial. I just won't ", "renewal", " a number I can't justify."],
            ["Grace Adeyemi", "05:33", "We look at the number again at sixty days out, before the ", "renewal", "."],
          ].map(([name, time, before, hit, after]) => (
            <div key={time} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-gray-900">{name}</span>
                <span className="text-sm tabular-nums text-blue-700">{time}</span>
              </div>
              <p className="mt-1 text-base leading-6 text-gray-700">
                {before}
                <mark className="rounded bg-yellow-200 px-0.5">{hit}</mark>
                {after}
              </p>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function SiteFooter() {
  const columns = [
    { head: "Product", items: ["Notetaker", "AI summaries", "Search", "Soundbites", "Analytics"] },
    { head: "Use cases", items: ["Sales", "Recruiting", "Engineering", "Product research"] },
    { head: "Learn", items: ["Help centre", "Blog", "Customers", "Changelog"] },
    { head: "Company", items: ["About", "Careers", "Terms of service", "Privacy policy"] },
  ];
  return (
    <footer className="bg-gray-900 py-16 text-gray-400">
      <div className="mx-auto max-w-[1140px] px-5">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo size={26} />
              <span className="font-display text-lg font-medium text-white">fireflies.ai</span>
            </Link>
            <p className="mt-4 max-w-xs text-base leading-6">
              An independent clone built as an engineering assignment. Not affiliated with Fireflies.ai.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.head}>
              <p className="text-base font-semibold text-white">{column.head}</p>
              <ul className="mt-4 space-y-2.5">
                {column.items.map((item) => (
                  <li key={item} className="text-base">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-base">
          <p>Built by Kunal Kumar as an SDE Fullstack assignment.</p>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-white hover:underline">
            Open the app
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
