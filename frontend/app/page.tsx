import {
  Bot, Crosshair, Globe, Sparkles, Upload, Users, Zap,
} from "lucide-react";

import { AskSection } from "@/components/marketing/AskSection";
import { ClosingCta } from "@/components/marketing/ClosingCta";
import { CollaborationSection } from "@/components/marketing/CollaborationSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FeatureSection } from "@/components/marketing/FeatureSection";
import { Hero } from "@/components/marketing/Hero";
import { InsightsSection } from "@/components/marketing/InsightsSection";
import { KnowledgeSection } from "@/components/marketing/KnowledgeSection";
import { LogoMarquee } from "@/components/marketing/LogoMarquee";
import { SearchShowcase } from "@/components/marketing/SearchShowcase";
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
 * Ground moves in bands rather than striping section by section: a dark opening,
 * a long lavender stretch, white through the middle, and black under the two
 * sections that need the most contrast. #100730 is the hero's own ground and is
 * used only to open and close the page — a third band of it mid-scroll reads as
 * though you have scrolled back to the top.
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
              Transcripts You Can
              <br />
              <span className="text-purple-600">Search</span>, Quote &amp;{" "}
              <span className="text-purple-600">Act On</span>
            </>
          }
          features={[
            { icon: <Crosshair className="size-4" />, title: "Precise Timestamps", body: "Click any line to land on the exact moment it was said." },
            { icon: <Globe className="size-4" />, title: "Any Meeting Source", body: "Zoom, Meet, Teams or a file on your desktop." },
            { icon: <Users className="size-4" />, title: "Speaker Attribution", body: "Every line attributed, and renameable in one click." },
            { icon: <Zap className="size-4" />, title: "Instant Recall", body: "Search inside a transcript and every match lights up." },
          ]}
          shot={{
            src: "/shot-transcript.png",
            alt: "The transcript panel: speaker labels, timestamps and inline search",
            width: 700,
            height: 1262,
            fade: true,
          }}
        />

        <FeatureSection
          ground="light"
          layout="below"
          heading={<>Comprehensive <span className="text-purple-600">AI Summaries</span></>}
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
              <span className="text-purple-600">Start</span> From Any{" "}
              <span className="text-purple-600">Transcript</span>
            </>
          }
          lede="Drop in a file, paste raw text, or bring a transcript across from the tools you already run calls on. Speakers, timestamps and a searchable timeline in seconds."
          features={[
            { icon: <Bot className="size-4" />, title: "Connect Your Calls", body: "Bring across the transcript Zoom, Meet, Teams or Slack hands you." },
            { icon: <Upload className="size-4" />, title: "Upload A Transcript", body: "Drop in .txt, .vtt, .srt or .json and it is parsed instantly." },
            { icon: <Sparkles className="size-4" />, title: "Paste Anything", body: "Even an untimed wall of text gets speakers and a working timeline." },
          ]}
          shot={{
            src: "/shot-upload.png",
            alt: "The uploads screen, listing every transcript format that can be ingested",
            width: 1600,
            height: 1000,
          }}
        />

        <SearchShowcase />

        <AskSection />

        <InsightsSection />

        <KnowledgeSection />
        <SkillsSection />
        <StackSection />
        <SecuritySection />
        <CollaborationSection />
        <TestimonialCarousel />
        <FaqSection />
        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}
