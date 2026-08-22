import Image from "next/image";
import { PanelCard, Section, SectionHeading } from "./primitives";

/**
 * The signature layout of their page, which mine was missing entirely: a
 * centred heading over two large tinted cards, each holding a white panel of
 * the real UI.
 *
 * It is what makes their content sections run past 1000px tall while mine sat
 * at half that — the height comes from two full product panels side by side,
 * not from padding.
 */
export function SearchShowcase() {
  return (
    <Section ground="white">
      <div className="mx-auto max-w-[760px] text-center">
        <SectionHeading>
          <span className="text-purple-600">Remember</span> Every Conversation With{" "}
          <span className="text-purple-600">AI Powered Search</span>
        </SectionHeading>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
          One query across every transcript, title and action item — then ask a question and get an answer
          with the lines it came from.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <PanelCard
          tint="fuchsia"
          title="Search everything at once"
          body="A real full-text index with relevance ranking, not a substring scan."
        >
          <Image
            src="/shot-search-card.png"
            alt="Workspace-wide search, faceted across meetings, transcript lines and action items"
            width={1730}
            height={1380}
            className="w-full"
          />
        </PanelCard>

        <PanelCard
          tint="mint"
          title="Ask, and get it cited"
          body="Every answer carries the transcript lines it was drawn from."
        >
          <Image
            src="/shot-ask-card.png"
            alt="A question answered from the transcripts, with cited lines and timestamps"
            width={795}
            height={1000}
            className="w-full"
          />
        </PanelCard>
      </div>
    </Section>
  );
}
