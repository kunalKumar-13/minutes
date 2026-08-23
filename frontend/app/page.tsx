import {
  Crosshair, Globe, Users, Zap,
} from "lucide-react";

import { AskSection } from "@/components/marketing/AskSection";
import { CaptureSection } from "@/components/marketing/CaptureSection";
import { ClosingCta } from "@/components/marketing/ClosingCta";
import { CollaborationSection } from "@/components/marketing/CollaborationSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FeatureSection } from "@/components/marketing/FeatureSection";
import { Hero } from "@/components/marketing/Hero";
import { InsightsSection } from "@/components/marketing/InsightsSection";
import { LogoMarquee } from "@/components/marketing/LogoMarquee";
import { SearchShowcase } from "@/components/marketing/SearchShowcase";
import { AnnouncementBar, MarketingNav } from "@/components/marketing/MarketingNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SkillsSection } from "@/components/marketing/SkillsSection";
import { TabbedShowcase } from "@/components/marketing/TabbedShowcase";
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

        <TabbedShowcase
          ground="light"
          heading={<>Comprehensive <span className="text-purple-600">AI Summaries</span></>}
          lede="An overview, timestamped chapters, action items attributed to whoever committed to them, and the decisions the meeting actually reached."
          tabs={[
            { label: "Overview", src: "/panel-notes.png", alt: "A meeting's notes, opening with the overview" },
            { label: "Chapters", src: "/panel-chapters.png", alt: "The meeting split into timestamped chapters" },
            { label: "Action items", src: "/panel-tasks.png", alt: "Action items across the workspace, with owners and due dates" },
          ]}
        />

        <CaptureSection />

        <SearchShowcase />

        <AskSection />

        <InsightsSection />

        <TabbedShowcase
          ground="dark"
          heading={<>All Your Tasks, People &amp; <span className="text-purple-400">Knowledge</span> In One Place</>}
          lede="Commitments do not stay buried in the meeting they were made in. Every action item across the workspace collects on one page, grouped by whoever owes it."
          tabs={[
            { label: "Tasks", src: "/panel-tasks.png", alt: "Every action item across the workspace, grouped by owner" },
            { label: "People", src: "/panel-people.png", alt: "Everyone who has spoken in the workspace, with their meetings" },
            { label: "Soundbites", src: "/panel-soundbites.png", alt: "Clipped moments saved from across the meetings" },
          ]}
        />
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
