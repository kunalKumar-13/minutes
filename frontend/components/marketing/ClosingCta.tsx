import { CtaButton, SectionHeading, STARS } from "./primitives";

/**
 * The closing panel.
 *
 * An aurora sits behind it — a violet bloom off the right edge and a cooler one
 * bottom-left, over the same starfield as the hero — so the page ends on
 * something lit rather than on flat dark.
 */
export function ClosingCta() {
  return (
    <section className="relative overflow-hidden bg-[#100730] py-28 text-center text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0" style={{ backgroundImage: STARS, backgroundRepeat: "no-repeat" }} />
        <div className="absolute -right-32 top-1/2 h-[420px] w-[720px] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(161,101,249,0.45),rgba(122,90,248,0.18),transparent)] blur-2xl" />
        <div className="absolute -left-24 bottom-0 h-[300px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(87,127,255,0.28),transparent)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-[760px] px-5">
        <SectionHeading onDark>
          Unlock The Knowledge Buried
          <br />
          Inside Your Conversations
        </SectionHeading>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <CtaButton variant="primary" size="lg">
            Try It For Free
          </CtaButton>
          <CtaButton href="#how" variant="ghost" size="lg">
            See How It Works
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
