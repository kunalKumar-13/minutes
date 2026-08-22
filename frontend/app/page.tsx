import {
  BarChart3, Bot, Crosshair, Globe, Scissors, Search, Sparkles, Upload, Users, Zap,
} from "lucide-react";

import { AskSection } from "@/components/marketing/AskSection";
import { ClosingCta } from "@/components/marketing/ClosingCta";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FeatureSection } from "@/components/marketing/FeatureSection";
import { Hero } from "@/components/marketing/Hero";
import { KnowledgeSection } from "@/components/marketing/KnowledgeSection";
import { LogoMarquee } from "@/components/marketing/LogoMarquee";
import { AnnouncementBar, MarketingNav } from "@/components/marketing/MarketingNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SkillsSection } from "@/components/marketing/SkillsSection";
import { SecuritySection, StackSection } from "@/components/marketing/StackSection";
import { TestimonialCarousel } from "@/components/marketing/TestimonialCarousel";

/*
 * The landing page is composition only. Every section owns its own markup and
 * copy, so changing one cannot disturb another, and the five sections that
 * share a shape share one component rather than five near-identical files.
 *
 * Ground alternates light → dark → white deliberately: it is what gives the
 * page rhythm as you scroll, and it is why the order below matters as much as
 * the sections themselves.
 */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white font-sans text-gray-900">
      <AnnouncementBar />
      <MarketingNav />

      <main>
        <Hero />

        {/* Clears the hero screenshot's overhang. */}
        <LogoMarquee />

        <FeatureSection
          id="how"
          ground="light"
          heading={
            <>
              High Quality Meeting
              <br />
              <span className="text-purple-600">Transcription</span> &amp;{" "}
              <span className="text-purple-600">Recording</span>
            </>
          }
          features={[
            { icon: <Crosshair className="size-4" />, title: "95% Accurate", body: "Speaker-attributed transcripts you can actually quote from." },
            { icon: <Globe className="size-4" />, title: "100+ Languages", body: "English, Spanish, French, Hindi and many more." },
            { icon: <Users className="size-4" />, title: "Speaker Recognition", body: "Every line attributed, and renameable in one click." },
            { icon: <Zap className="size-4" />, title: "Auto-Language Detection", body: "Switch between languages meeting to meeting." },
          ]}
          shot={{
            src: "/shot-transcript.png",
            alt: "The transcript panel: speaker labels, timestamps and inline search",
            width: 432,
            height: 544,
          }}
        />

        <FeatureSection
          ground="dark"
          layout="below"
          heading={<>Comprehensive <span className="text-purple-400">AI Summaries</span></>}
          lede="An overview, timestamped chapters, action items attributed to whoever committed to them, and the decisions the meeting actually reached."
          shot={{
            src: "/shot-notes.png",
            alt: "AI notes beside the analysis panel: overview, chapters, action items, sentiment and talk time",
            width: 1122,
            height: 904,
          }}
        />

        <FeatureSection
          layout="below"
          heading={
            <>
              <span className="text-purple-600">Capture</span> Meetings{" "}
              <span className="text-purple-600">Anywhere</span> &amp; Anytime
            </>
          }
          lede="Speech-to-text is out of scope here, so a meeting starts from a transcript you already have — pasted, uploaded, or seeded."
          features={[
            { icon: <Bot className="size-4" />, title: "Notetaker Bot", body: "Invite the bot to a call, or let it auto-join from your calendar." },
            { icon: <Upload className="size-4" />, title: "Upload A Recording", body: "Drop in a .txt, .vtt, .srt or .json transcript and it is parsed instantly." },
            { icon: <Sparkles className="size-4" />, title: "Paste Anything", body: "Even an untimed wall of text gets speakers and a working timeline." },
          ]}
          shot={{
            src: "/shot-upload.png",
            alt: "The uploads screen, listing every transcript format that can be ingested",
            width: 1600,
            height: 1000,
          }}
        />

        <FeatureSection
          ground="light"
          reversed
          heading={
            <>
              Remember Every Conversation With{" "}
              <span className="text-purple-600">AI Powered Search</span>
            </>
          }
          lede="One query across every transcript, meeting title and action item — ranked by a real full-text index, not a substring scan."
          checklist={[
            "Full-text search with relevance ranking",
            "Highlighted matches with prev/next stepping",
            "Filter by participant, channel or date",
            "Answers grounded in cited transcript lines",
          ]}
          cta={null}
          shot={{
            src: "/shot-search.png",
            alt: "Workspace-wide search, faceted across meetings, transcript lines and action items",
            width: 1600,
            height: 1000,
          }}
        />

        <AskSection />

        <FeatureSection
          layout="below"
          heading={<>Drive Insights With <span className="text-purple-600">Conversation Intelligence</span></>}
          lede="Who dominated, who never got a word in, what the workspace actually spends its time on — derived from the transcripts themselves."
          cta={null}
          features={[
            { icon: <BarChart3 className="size-4" />, title: "Talk Time", body: "Share of the conversation, plus words per minute." },
            { icon: <Sparkles className="size-4" />, title: "Topics", body: "What this workspace actually spends its time on." },
            { icon: <Scissors className="size-4" />, title: "Soundbites", body: "Clip the moment that mattered and keep it." },
            { icon: <Search className="size-4" />, title: "Trends", body: "Meeting volume and follow-through over time." },
          ]}
          shot={{
            src: "/shot-analytics.png",
            alt: "Analytics: talk time, meeting volume and recurring topics",
            width: 1600,
            height: 1000,
          }}
        />

        <KnowledgeSection />
        <SkillsSection />
        <StackSection />
        <SecuritySection />
        <TestimonialCarousel />
        <FaqSection />
        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}
