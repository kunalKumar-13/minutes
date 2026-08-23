import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { Shot, STARS } from "./primitives";

/**
 * The opening panel.
 *
 * The product shot straddles the fold deliberately: it begins inside the dark
 * ground and runs on past it, which is what gives the section depth. The
 * negative margin pulls whatever follows up underneath it, so the next section
 * needs matching top padding to clear the overhang.
 *
 * The starfield lives in its own clipped wrapper rather than on the section, so
 * the section itself can let the screenshot overflow.
 */
export function Hero() {
  return (
    <section className="relative bg-[#100730] pt-24 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: STARS, backgroundRepeat: "no-repeat" }} />
        <div className="absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(122,90,248,0.18),transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-[1080px] px-5">
        <h1 className="font-display text-[36px] font-medium leading-[1.32] tracking-[0.02em] text-gray-50 sm:text-[46px] lg:text-[56px]">
          Turn Every Meeting Into
          <br />
          Notes, Actions, Answers
        </h1>
        <p className="mx-auto mt-6 max-w-[760px] text-[18px] leading-[1.56] tracking-[-0.22px] text-gray-300">
          Transcribe, summarise, search, and analyse every team conversation.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-12 items-center gap-2 rounded bg-purple-500 px-3.5 font-display text-[16px] font-medium text-white transition-colors hover:bg-purple-600"
          >
            Get Started
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="#how"
            className="inline-flex h-12 items-center rounded bg-[rgba(241,241,249,0.14)] px-3.5 font-display text-[16px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-[rgba(241,241,249,0.2)]"
          >
            Request Demo
          </Link>
        </div>

        {/* Capability strip, seated directly on top of the product shot. */}
        <div className="mx-auto mt-16 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-t-xl bg-[#1b1240] px-6 py-3.5 text-[16px] text-gray-100">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-4 text-purple-300" />
            Notes, chapters and action items
          </span>
          <span className="hidden h-5 w-px bg-white/20 sm:block" />
          <span className="inline-flex items-center gap-2">
            <Search className="size-4 text-green-400" />
            Answers from every meeting
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mb-24 max-w-[1240px] px-5 sm:-mb-40">
        <Shot
          src="/hero-app.png"
          alt="The meeting view: AI notes on the left, an interactive transcript on the right"
          width={1600}
          height={1000}
          priority
          className="shadow-[0_30px_90px_rgba(0,0,0,0.5)] ring-white/10"
        />
      </div>
    </section>
  );
}
