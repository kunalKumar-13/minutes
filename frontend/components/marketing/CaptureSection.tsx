import Image from "next/image";
import { FileCode2, FileJson, FileText, Captions } from "lucide-react";
import { PanelCard, Section, SectionHeading } from "./primitives";

/**
 * Getting a conversation in.
 *
 * Their shape: a centred heading over two large tinted cards that each carry a
 * panel of the product, then a quiet row of format marks underneath. The
 * previous version was a left-aligned text column over a wide screenshot scaled
 * too small to read, which is a different section entirely.
 */

const FORMATS = [
  { icon: <FileText className="size-5" />, label: ".txt", note: "Plain text, timed or not" },
  { icon: <Captions className="size-5" />, label: ".vtt", note: "WebVTT captions" },
  { icon: <FileCode2 className="size-5" />, label: ".srt", note: "SubRip subtitles" },
  { icon: <FileJson className="size-5" />, label: ".json", note: "Structured exports" },
];

export function CaptureSection() {
  return (
    <Section>
      <div className="mx-auto max-w-[760px] text-center">
        <SectionHeading>
          <span className="text-purple-600">Start</span> From Any{" "}
          <span className="text-purple-600">Transcript</span>
        </SectionHeading>
        <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
          Bring a conversation across from the tools you already run calls on, or paste it straight in.
          Speakers, timestamps and a searchable timeline in seconds.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        <PanelCard
          tint="violet"
          title="Upload a transcript"
          body="Drop in a file and it is parsed on arrival, with speakers and timings kept intact."
        >
          <Image
            src="/card-upload.png"
            alt="The uploads screen, listing every transcript format that can be ingested"
            width={1080}
            height={710}
            className="w-full"
          />
        </PanelCard>

        <PanelCard
          tint="amber"
          title="Paste anything"
          body="Even an untimed wall of text comes back with speakers and a working timeline."
        >
          <Image
            src="/card-notes.png"
            alt="A pasted transcript after parsing, with speakers and timestamps"
            width={900}
            height={852}
            className="w-full"
          />
        </PanelCard>
      </div>

      {/* The quiet mark row their section closes on. */}
      <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {FORMATS.map((f) => (
          <li key={f.label} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded bg-purple-25 text-purple-600">
              {f.icon}
            </span>
            <span>
              <span className="block text-[16px] font-medium leading-[1.48] tracking-[-0.16px] text-gray-900">
                {f.label}
              </span>
              <span className="block text-[16px] leading-[1.48] tracking-[-0.16px] text-gray-500">
                {f.note}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
