"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BarChart3, Bot, Check, ChevronDown, Crosshair, Database, Download,
  Github, Globe, Lock, Menu, Plus, Scissors, Search, Shield, Sparkles, Star, Upload, Users, X, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const NAV = ["Product", "Solutions", "Integration", "Resources"];

/** A denser starfield than a handful of dots — drawn, never fetched. */
const STARS = [
  ["8%", "14%", 1, 0.45], ["17%", "31%", 1, 0.3], ["23%", "9%", 1.5, 0.5],
  ["31%", "48%", 1, 0.35], ["38%", "18%", 1, 0.4], ["44%", "63%", 1.5, 0.3],
  ["52%", "12%", 1, 0.45], ["58%", "39%", 1, 0.28], ["64%", "71%", 1.5, 0.4],
  ["71%", "22%", 1, 0.5], ["77%", "55%", 1, 0.3], ["83%", "16%", 1.5, 0.42],
  ["89%", "44%", 1, 0.35], ["94%", "27%", 1, 0.3], ["12%", "67%", 1, 0.32],
  ["27%", "79%", 1.5, 0.28], ["49%", "86%", 1, 0.3], ["68%", "8%", 1, 0.38],
  ["86%", "77%", 1, 0.26], ["4%", "42%", 1, 0.34],
]
  .map(([x, y, r, a]) => `radial-gradient(${r}px ${r}px at ${x} ${y}, rgba(255,255,255,${a}), transparent)`)
  .join(", ");

const TRANSCRIPTION_FACTS = [
  { icon: <Crosshair className="size-4" />, title: "95% Accurate", body: "Speaker-attributed transcripts you can actually quote from." },
  { icon: <Globe className="size-4" />, title: "100+ Languages", body: "English, Spanish, French, Hindi and many more." },
  { icon: <Users className="size-4" />, title: "Speaker Recognition", body: "Every line attributed, and renameable in one click." },
  { icon: <Zap className="size-4" />, title: "Auto-Language Detection", body: "Switch between languages meeting to meeting." },
];

const CAPTURE_WAYS = [
  { icon: <Bot className="size-4" />, title: "Notetaker Bot", body: "Invite the bot to a call, or let it auto-join from your calendar.", tint: "bg-purple-50 dark:bg-purple-500/10" },
  { icon: <Upload className="size-4" />, title: "Upload A Recording", body: "Drop in a .txt, .vtt, .srt or .json transcript and it is parsed instantly.", tint: "bg-yellow-50 dark:bg-yellow-500/10" },
  { icon: <Sparkles className="size-4" />, title: "Paste Anything", body: "Even an untimed wall of text gets speakers and a working timeline.", tint: "bg-teal-50 dark:bg-teal-500/10" },
];

const INTEGRATIONS = [
  { title: "Meeting platforms", items: ["Zoom", "Google Meet", "Microsoft Teams", "Webex"] },
  { title: "Calendars", items: ["Google Calendar", "Outlook", "iCal feeds"] },
  { title: "Where work happens", items: ["Slack", "Notion", "Asana", "Jira"] },
  { title: "Customer records", items: ["Salesforce", "HubSpot", "Pipedrive"] },
];

const FAQS = [
  {
    q: "Is this the real Fireflies.ai?",
    a: "No. It is an independent clone built as an engineering assignment, reproducing the product's design and its post-meeting workflows. It is not affiliated with Fireflies.ai, and no code from their product was used — the design tokens and layout were measured from the running site, and every line of implementation was written for this project.",
  },
  {
    q: "Does it actually transcribe audio?",
    a: "No, and that is deliberate — speech-to-text is explicitly out of scope for the assignment. Meetings start from a transcript you already have: seeded samples, a block of text you paste, or a file you upload. Everything downstream of that is real.",
  },
  {
    q: "So what is real, and what is a placeholder?",
    a: "Real: transcript parsing, the notes engine, full-text search, every CRUD path, sessions, exports, and the analysis panel. Placeholders, each labelled as such in the UI: live capture, third-party integrations, team sharing, custom AI skills, and the identity check behind sign-in.",
  },
  {
    q: "Where do the AI summaries come from?",
    a: "A deterministic extractive summariser built into the backend. It scores sentences by keyword density and position, splits the meeting into chapters, and extracts commitments using a small grammar of who-owes-what. Set an Anthropic key and Claude writes them instead, into the same shape — the LLM is an upgrade, never a dependency.",
  },
  {
    q: "How are action items attributed to the right person?",
    a: "By the grammar of the sentence. First person — \u201cI\u2019ll send it\u201d — belongs to whoever is speaking. Second person — \u201ccan you send it\u201d — belongs to whoever is being addressed, and a name in the vocative position wins over one mentioned later. In \u201cTom\u00e1s, can you draft the schema and send it to Daniel?\u201d the owner is Tom\u00e1s, not Daniel.",
  },
  {
    q: "What transcript formats can I upload?",
    a: "Plain text in four different layouts, WebVTT, SubRip, and JSON in a couple of shapes. Untimed text works too — timings are synthesised from a reading rate so the player and click-to-seek still function. There are sample files in the repository to try.",
  },
  {
    q: "How does search work?",
    a: "A real SQLite FTS5 index with bm25 ranking, not a substring scan. Every token you type is quoted before it reaches the index, so operators and stray quotes cannot be read as query syntax. A search box narrows as you add words; a question asked of a meeting ORs its content words instead, because no single line contains every word of a question.",
  },
  {
    q: "Is there really no password?",
    a: "Correct. The assignment scopes authentication as a placeholder, so no credential is checked and any provider signs you into the demo workspace. The session behind it is real though: a token with an expiry that the API validates, that you can revoke from Settings, and that the edge middleware enforces before any page renders.",
  },
  {
    q: "Is my data stored anywhere?",
    a: "Everything lives in a single SQLite database beside the API. There is no third-party analytics, no tracker, and no transcript leaves the server unless you configure a model key yourself. You can export any meeting as Markdown, plain text or JSON.",
  },
  {
    q: "Can I run it myself?",
    a: "Yes — the repository has setup instructions for both halves. The backend creates its schema and seeds a sample workspace on first boot, so a fresh clone is usable immediately with no configuration.",
  },
];

/**
 * The social-proof band under the hero.
 *
 * The companies are the fictional ones from this project's own seed data. Real
 * logos here would assert that real organisations use this, which is not true —
 * a clone should copy a layout, not borrow someone else's customers.
 */
function LogoWall() {
  const companies = [
    { name: "Northwind", suffix: "TRADERS" },
    { name: "LUMINA", suffix: "LABS" },
    { name: "Acme", suffix: "INC" },
    { name: "Beacon", suffix: "HEALTH" },
  ];
  return (
    <section className="bg-[#100730] pb-16 pt-40 sm:pt-56">
      <div className="mx-auto max-w-[1140px] px-5 text-center">
        <p className="text-base font-semibold uppercase tracking-[0.12em] text-gray-400">
          Built for teams that live in meetings
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-20 gap-y-10">
          {companies.map((company) => (
            <span key={company.name} className="flex items-baseline gap-2 opacity-45 grayscale">
              <span className="font-display text-2xl font-medium tracking-tight text-white">
                {company.name}
              </span>
              <span className="text-xs font-semibold tracking-[0.18em] text-white">{company.suffix}</span>
            </span>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-lg text-base leading-6 text-gray-500">
          The organisations above are the fictional ones seeded into the demo workspace.
        </p>
      </div>
    </section>
  );
}

function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        // 40px on a 56px line with -0.4px tracking — the original's H2, measured.
        "font-display text-[32px] font-medium leading-[1.4] tracking-[-0.4px] sm:text-[40px]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

          <div className="ml-auto flex shrink-0 items-center gap-4">
            <Link
              href="/login"
              className="hidden text-base font-medium text-white transition-opacity hover:opacity-80 sm:inline"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-lg bg-white px-4 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100 sm:inline-flex"
            >
              Request Demo
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg bg-purple-500 px-4 text-base font-medium text-white transition-colors hover:bg-purple-600"
            >
              Get Started
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
      <section className="relative bg-[#100730] pt-24 text-center">
        {/*
         * Starfield. Clipped by its own wrapper so the hero itself can let the
         * product shot overflow its bottom edge.
         */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: STARS, backgroundRepeat: "no-repeat" }} />
          <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(122,90,248,0.18),transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-[1080px] px-5">
          <h1 className="font-display text-[36px] font-medium leading-[1.32] tracking-[0.02em] text-gray-50 sm:text-[46px] lg:text-[56px]">
            The #1 AI Assistant For
            <br />
            Your Meetings
          </h1>
          <p className="mx-auto mt-6 max-w-[560px] text-[18px] leading-[1.56] tracking-[-0.22px] text-gray-300">
            Transcribe, summarize, search, and analyze all your team conversations.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-purple-500 px-6 text-md font-medium text-white transition-colors hover:bg-purple-600"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#how"
              className="inline-flex h-12 items-center rounded-lg bg-white/10 px-6 text-md font-medium text-white transition-colors hover:bg-white/15"
            >
              Request Demo
            </Link>
          </div>

          {/* Trust strip, sitting just above the product shot as on the original. */}
          <div className="mx-auto mt-16 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-t-xl bg-[#1b1240] px-6 py-3.5 text-md text-gray-100">
            <span className="inline-flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-[#ff492c] text-[10px] font-bold text-white">
                G
              </span>
              Rated 4.8 / 5
              <span className="flex gap-0.5" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className={cn("size-4", i < 4 ? "fill-orange-400 text-orange-400" : "fill-orange-400/35 text-orange-400/35")}
                  />
                ))}
              </span>
            </span>
            <span className="hidden h-5 w-px bg-white/20 sm:block" />
            <span className="inline-flex items-center gap-2">
              <Lock className="size-4 text-green-400" />
              GDPR, SOC2, More
            </span>
          </div>
        </div>

        {/*
         * The product shot straddles the fold: it starts inside the dark hero
         * and runs on into the section below, which is what gives the original
         * its depth. The negative margin pulls the next section up under it.
         */}
        <div className="relative z-10 mx-auto -mb-24 max-w-[1240px] px-5 sm:-mb-40">
          <div className="overflow-hidden rounded-xl bg-white shadow-[0_30px_90px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
            <Image
              src="/hero-app.png"
              alt="The meeting view: AI notes on the left, an interactive transcript on the right"
              width={1600}
              height={1000}
              priority
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- transcription */}
      <LogoWall />

      <section id="how" className="bg-purple-25 py-16">
        <div className="mx-auto grid max-w-[1140px] items-center gap-16 px-5 lg:grid-cols-2">
          <div>
            <SectionHeading>
              High Quality Meeting
              <br />
              <span className="text-purple-600">Transcription</span> &amp;{" "}
              <span className="text-purple-600">Recording</span>
            </SectionHeading>

            <Link
              href="/login"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-cta-purple px-5 text-base font-medium text-white shadow-e2 transition-opacity hover:opacity-90"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>

            <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {TRANSCRIPTION_FACTS.map((fact) => (
                <div key={fact.title}>
                  <span className="text-gray-900">{fact.icon}</span>
                  <dt className="mt-3 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">{fact.title}</dt>
                  <dd className="mt-1 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{fact.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Shot
            src="/shot-transcript.png"
            alt="The transcript panel: speaker labels, timestamps and inline search"
            width={432}
            height={544}
            className="mx-auto w-full max-w-[440px]"
          />
        </div>
      </section>

      {/* ---------------------------------------------------- AI summaries */}
      <section className="bg-[#100730] py-16 text-white">
        <div className="mx-auto max-w-[1140px] px-5">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <SectionHeading className="text-white">
                Comprehensive <span className="text-purple-400">AI Summaries</span>
              </SectionHeading>
              <p className="mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-400">
                An overview, timestamped chapters, action items attributed to whoever committed to them, and the
                decisions the meeting actually reached.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-purple-500 px-5 text-base font-medium text-white transition-colors hover:bg-purple-600"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* The original previews its note formats behind a pill switcher. */}
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {["Overview", "Bullet Points", "Action Items", "Custom Notes"].map((tab, index) => (
              <span
                key={tab}
                className={cn(
                  "rounded-md px-3.5 py-2 text-base font-medium",
                  index === 2 ? "bg-purple-500/25 text-white ring-1 ring-purple-400/40" : "bg-white/[0.07] text-gray-300",
                )}
              >
                {tab}
              </span>
            ))}
          </div>

          <Shot
            src="/shot-notes.png"
            alt="AI notes beside the analysis panel: overview, chapters, action items, sentiment and talk time"
            width={1122}
            height={904}
            className="mx-auto mt-10 max-w-[960px] ring-white/10"
          />
        </div>
      </section>

      {/* --------------------------------------------------------- capture */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-[1140px] px-5 text-center">
          <SectionHeading>
            <span className="text-purple-600">Capture</span> Meetings{" "}
            <span className="text-purple-600">Anywhere</span> &amp; Anytime
          </SectionHeading>

          <Shot
            src="/shot-upload.png"
            alt="The uploads screen, listing every transcript format that can be ingested"
            width={1600}
            height={1000}
            className="mx-auto mt-10 max-w-[960px]"
          />

          <div className="mt-8 grid gap-5 text-left md:grid-cols-3">
            {CAPTURE_WAYS.map((way) => (
              <div key={way.title} className={cn("rounded-2xl p-6", way.tint)}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-white text-purple-600 shadow-e1 dark:bg-ink-500">
                  {way.icon}
                </span>
                <h3 className="mt-4 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">{way.title}</h3>
                <p className="mt-1.5 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{way.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- search */}
      <section className="bg-purple-25 py-16">
        <div className="mx-auto grid max-w-[1140px] items-center gap-16 px-5 lg:grid-cols-2">
          <div>
            <SectionHeading>
              Remember Every Conversation With{" "}
              <span className="text-purple-600">AI Powered Search</span>
            </SectionHeading>
            <p className="mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
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
                <li key={item} className="flex items-start gap-2.5 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-600">
                  <Check className="mt-1 size-4 shrink-0 text-purple-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Shot
            src="/shot-search.png"
            alt="Workspace-wide search, faceted across meetings, transcript lines and action items"
            width={1600}
            height={1000}
            className="lg:-mr-10"
          />
        </div>
      </section>

      {/* ------------------------------------------------------- analytics */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-[1140px] px-5">
          <SectionHeading className="max-w-2xl">
            Drive Insights With <span className="text-purple-600">Conversation Intelligence</span>
          </SectionHeading>

          <Shot
            src="/shot-analytics.png"
            alt="Analytics: talk time, meeting volume and recurring topics"
            width={1600}
            height={1000}
            className="mx-auto mt-10 max-w-[960px]"
          />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <BarChart3 className="size-4" />, title: "Talk Time", body: "Who dominated, and who never got a word in." },
              { icon: <Sparkles className="size-4" />, title: "Topics", body: "What this workspace actually spends its time on." },
              { icon: <Scissors className="size-4" />, title: "Soundbites", body: "Clip the moment that mattered and keep it." },
              { icon: <Search className="size-4" />, title: "Trends", body: "Meeting volume and follow-through over time." },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-gray-200 p-6">
                <span className="flex size-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  {card.icon}
                </span>
                <h3 className="mt-4 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">{card.title}</h3>
                <p className="mt-1.5 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- integrations */}
      <section className="bg-purple-25 py-16">
        <div className="mx-auto max-w-[1140px] px-5 text-center">
          <SectionHeading>
            Designed To Fit <span className="text-purple-600">Your Stack</span>
          </SectionHeading>
          <p className="mx-auto mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
            The ingest pipeline takes a transcript from anywhere, so connecting a source is a matter of
            writing an adapter rather than reworking the app.
          </p>

          <div className="mt-12 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {INTEGRATIONS.map((group) => (
              <div key={group.title} className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
                <p className="text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">{group.title}</p>
                <ul className="mt-3 space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="text-base text-gray-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-xl text-base leading-6 text-gray-500">
            Uploading a transcript works today. The connectors above are the roadmap, and the app says so
            wherever one would appear.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- security */}
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-[1140px] items-center gap-16 px-5 lg:grid-cols-2">
          <div>
            <SectionHeading>
              Your Conversations, <span className="text-purple-600">Your Data</span>
            </SectionHeading>
            <p className="mt-5 max-w-[480px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
              Everything lives in a single database beside the API. No third-party analytics, and no
              transcript leaves the server unless you configure a model key yourself.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Sessions carry a real token and expiry, revocable at any time",
                "The edge guard runs before any application code",
                "No telemetry, no trackers, no third-party scripts",
                "Export everything as Markdown, plain text or JSON",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-600">
                  <Check className="mt-1 size-4 shrink-0 text-purple-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: <Lock className="size-4" />, t: "Session control", b: "Issue and revoke per browser." },
              { icon: <Shield className="size-4" />, t: "Guarded routes", b: "Enforced at the edge." },
              { icon: <Database className="size-4" />, t: "Single store", b: "One file you can back up." },
              { icon: <Download className="size-4" />, t: "Full export", b: "Nothing is locked in." },
            ].map((card) => (
              <div key={card.t} className="rounded-2xl bg-purple-25 p-6 ring-1 ring-gray-200">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white text-purple-600 shadow-e1">
                  {card.icon}
                </span>
                <p className="mt-4 text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">{card.t}</p>
                <p className="mt-1 text-base leading-6 text-gray-500">{card.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- FAQ */}
      <section className="bg-purple-25 py-16">
        <div className="mx-auto max-w-[800px] px-5">
          <SectionHeading className="text-center">Frequently Asked Questions</SectionHeading>

          <dl className="mt-12">
            {FAQS.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={faq.q} className="border-b border-gray-200">
                  <dt>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="group flex w-full items-center justify-between gap-6 py-5 text-left"
                    >
                      <span className="text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-800 transition-colors group-hover:text-gray-900">
                        {faq.q}
                      </span>
                      {/* A plus that turns into a cross, as on the original. */}
                      <Plus
                        className={cn(
                          "size-5 shrink-0 text-gray-400 transition-transform duration-200",
                          open && "rotate-45",
                        )}
                      />
                    </button>
                  </dt>
                  {open && (
                    <dd className="max-w-[620px] pb-6 pr-12 text-[16px] leading-[1.62] tracking-[-0.16px] text-gray-500">{faq.a}</dd>
                  )}
                </div>
              );
            })}
          </dl>

          <p className="mx-auto mt-10 max-w-[560px] text-center text-[16px] leading-[1.62] tracking-[-0.16px] text-gray-500">
            Still have questions? The{" "}
            <a
              href="https://github.com/kunalKumar-13/minutes#readme"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-purple-700 underline underline-offset-2 hover:text-purple-800"
            >
              README
            </a>{" "}
            covers the architecture, the schema and the reasoning behind both.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- CTA */}
      <section className="relative overflow-hidden bg-[#100730] py-28 text-center text-white">
        {/* Aurora bloom on the right, plus the same starfield as the hero. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0" style={{ backgroundImage: STARS, backgroundRepeat: "no-repeat" }} />
          <div className="absolute -right-32 top-1/2 h-[420px] w-[720px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(161,101,249,0.45),rgba(122,90,248,0.18),transparent)] blur-2xl" />
          <div className="absolute -left-24 bottom-0 h-[300px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(87,127,255,0.28),transparent)] blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-[760px] px-5">
          <SectionHeading className="text-white">
            Unlock The Knowledge Buried
            <br />
            Inside Your Conversations
          </SectionHeading>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-cta-purple px-6 text-md font-medium text-white shadow-e2 transition-opacity hover:opacity-90"
            >
              Try It For Free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#how"
              className="inline-flex h-12 items-center rounded-lg bg-white/10 px-6 text-md font-medium text-white transition-colors hover:bg-white/15"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* -------------------------------------------------------------- mockups */


/**
 * A real screenshot of the app, framed.
 *
 * These sections were previously small hand-drawn mocks floating in a lot of
 * padding, which made the page read as unfinished. Showing the product at size
 * is both more honest and what fills the space.
 */
function Shot({
  src, alt, width, height, className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(16,24,40,0.16)] ring-1 ring-gray-200",
        className,
      )}
    >
      <Image src={src} alt={alt} width={width} height={height} className="w-full" />
    </div>
  );
}

function SiteFooter() {
  /*
   * Five columns, two of which stack a second heading underneath — the same
   * shape as the original. The content is this project's own: what it actually
   * does, what it is built on, and where to read the reasoning.
   */
  const product = [
    "Meetings library", "Interactive transcript", "AI notes & chapters", "Action items",
    "Soundbites", "Workspace search", "Analytics", "Uploads", "Comments", "Exports",
    "Dark mode", "Keyboard shortcuts",
  ];
  const useCases = [
    "Sales calls", "Customer QBRs", "Interviews", "Standups",
    "Design reviews", "Retros", "Research", "Hiring debriefs",
  ];
  const integrations = [
    "Zoom", "Google Meet", "Microsoft Teams", "Google Calendar",
    "Outlook", "Slack", "Salesforce", "HubSpot",
  ];
  const project = ["README", "Architecture", "Database schema", "API reference"];
  const learn = ["Design notes", "Layout spec", "Sample transcripts", "Seed data"];
  const openIt = ["Open the app", "Sign in", "API docs"];
  const help = ["GitHub repository", "Report an issue"];

  const Column = ({ title, items }: { title: string; items: string[] }) => (
    <div>
      <p className="text-md font-semibold text-white">{title}</p>
      <ul className="mt-5 space-y-2.5">
        {items.map((item) => (
          <li key={item}>
            <span className="text-base text-gray-400 transition-colors hover:text-white">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-[#0a0518] pb-10 pt-20">
      <div className="mx-auto max-w-[1140px] px-5">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <Column title="Product" items={product} />
          <Column title="Use Cases" items={useCases} />
          <Column title="Integrations" items={integrations} />

          <div className="space-y-10">
            <Column title="Project" items={project} />
            <Column title="Learn" items={learn} />
          </div>

          <div className="space-y-10">
            <div>
              <p className="text-md font-semibold text-white">Open It</p>
              {/* A real code: it encodes the repository URL and scans. */}
              <div className="mt-5 w-fit rounded-xl bg-white p-2.5">
                <Image
                  src="/qr-repo.png"
                  alt="QR code linking to the source repository on GitHub"
                  width={492}
                  height={492}
                  className="size-[132px]"
                />
              </div>
              <p className="mt-3 max-w-[190px] text-base leading-6 text-gray-400">
                Scan for the source, or open the seeded demo — no signup, no credential.
              </p>
              <ul className="mt-5 space-y-2.5">
                {openIt.map((item) => (
                  <li key={item}>
                    <span className="text-base text-gray-400 transition-colors hover:text-white">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Column title="Help" items={help} />
          </div>
        </div>

        {/* Bottom bar: mark and copyright, then the tech line, then links. */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-7">
          <div className="flex items-center gap-3">
            <Logo size={22} />
            <p className="text-base text-gray-500">
              © {new Date().getFullYear()} Minutes — an independent Fireflies.ai clone. Not affiliated.
            </p>
          </div>

          <p className="text-base text-gray-500">
            {["Next.js", "FastAPI", "SQLite"].map((t, i) => (
              <span key={t}>
                {i > 0 && <span className="mx-1.5 text-gray-700">·</span>}
                {t}
              </span>
            ))}
          </p>

          <div className="flex items-center gap-5">
            <a
              href="https://github.com/kunalKumar-13/minutes"
              target="_blank"
              rel="noreferrer"
              aria-label="Source on GitHub"
              className="text-gray-500 transition-colors hover:text-white"
            >
              <Github className="size-4" />
            </a>
            <Link href="/login" className="text-base text-gray-500 transition-colors hover:text-white">
              Open the app
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
