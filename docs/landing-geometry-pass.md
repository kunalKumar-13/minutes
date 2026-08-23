# Landing page — geometry and header pass

Step 6 of [`landing-rebuild-plan.md`](./landing-rebuild-plan.md): *"re-run the
probe and diff the numbers again."* This is that diff, and the fixes it found.

Everything below was read off both pages with the same CDP probe at the same
viewports — `getComputedStyle` + `getBoundingClientRect`, never a screenshot.
Original: `https://fireflies.ai/`. Clone: the dev server at `127.0.0.1:3000`.

The first pass fixed the *material* of the page — radius, tints, type, buttons.
It left three things wrong that no amount of section-level work could reach,
because all three were set in one place each.

---

## 1. The rail was 100px too narrow, at every width

Measured left edge and width of the content column:

| viewport | theirs | mine (before) | mine (after) |
|---|---|---|---|
| 768 | 720 @ 24 | 688 @ 40 | **720 @ 24** |
| 1024 | 896 @ 64 | 784 @ 120 | **896 @ 64** |
| 1280 | 1072 @ 104 | 1040 @ 120 | **1072 @ 104** |
| 1440 | 1200 @ 120 | 1100 @ 170 | **1200 @ 120** |
| 1680 | 1200 @ 240 | 1200 @ 240 | **1200 @ 240** |

Mine was `max-w-[1140px] px-5` — a 1100px column starting at x=170, so every
section sat 50px inside theirs on both edges and the page read as if it had been
shrunk to fit.

Their gutters are not a breakpoint ladder. 24 / 64 / 104 / 120 against
768 / 1024 / 1280 / 1440 is a straight line: **gutter = 0.15625·vw − 96px**,
flattening once the 1440px max-width takes over. Stepped padding cannot
reproduce that — between 768 and 1440 it is wrong by up to 56px somewhere. So
the gutter is now one solved token,

```ts
// tailwind.config.ts
spacing: { rail: "clamp(24px, 15.625vw - 96px, 120px)" }
```

used through a single `RAIL` constant in `primitives.tsx` and applied by every
section, the nav, the hero and the footer. The after-column above is exact at
all five widths.

### What the width fixed on its own

Their paired feature cards, and mine once the rail was right:

| row | theirs | mine (before) | mine (after) |
|---|---|---|---|
| capture | 690 @ 120 + 486 @ 834, gap 24 | 538 + 538, gap 24 | **690 @ 120 + 486 @ 834, gap 24** |
| search | 588 @ 120 + 588 @ 732, gap 24 | 538 + 538, gap 24 | **588 @ 120 + 588 @ 732, gap 24** |

The search row fell out of the rail fix for free. The capture row also needed
its split: theirs is **not** an equal pair. `lg:grid-cols-[690fr_486fr]` puts
both cards on their exact x positions.

Card heights are 501 against their 503 and 571 — the first matches, the second
is 70px short because my panel image is shorter than theirs. Left alone: padding
it out would be filling space rather than showing product.

---

## 2. Section rhythm was 96px where theirs is 120px

Their section padding, measured across the page: `140 / 120 / 120 / 120 / 120 /
120 / 120 / 80`. Mine was `py-24` — 96px — on all of them, including the four
sections that had their own hand-written `<section>` and never went through
`Section` at all.

Now `py-20 lg:py-[120px]`, and `FaqSection`, `AskSection`, `StackSection` and
`TestimonialCarousel` were moved onto `RAIL` so there is one rail and one
rhythm rather than two of each.

Page height, as a check on the sum of all of it: **16530 against their 16435**,
0.6% apart, on a page that is 16 sections deep.

---

## 3. The header was the wrong element entirely

Theirs is `position: fixed` over a transparent ground, and it does two things
past the fold. Measured at four scroll positions:

| state | `position` | `transform` | background |
|---|---|---|---|
| at top | fixed | none | `rgba(0,0,0,0)` |
| scrolled to 1500 | fixed | `translateY(-117px)` | `rgb(255,255,255)` |
| scrolled to 3000 | fixed | `translateY(-117px)` | `rgb(255,255,255)` |
| scrolled up 600 | fixed | none | `rgb(255,255,255)` |

So: transparent while it is over the hero, **white** once past it, and it slides
away on a downward scroll and back on an upward one — 250ms on
`cubic-bezier(0.22, 1, 0.36, 1)`, which is in their own class list.

Mine was a `sticky` bar in solid `#100730`, permanently parked over the content.
It is now one `MarketingHeader` — the announcement bar and the nav in a single
fixed element — reproducing all four states. The clone now measures
`fixed / none / transparent`, `-116 / white`, `-116 / white`, `0 / white`.

Because the bar goes white, the links need two colour states. Both were measured
rather than picked, and both land on tokens already in the theme:

| | over the hero | on white |
|---|---|---|
| nav links | `rgba(250,250,253,0.78)` | `rgb(71,84,103)` = `gray-600` |
| Login | `rgb(189,180,254)` = `purple-300` | `rgb(105,56,239)` = `purple-600` |
| wordmark | white | `gray-900` |

The links were also the wrong type: 16px Inter where theirs are **14px / 500 /
DM Sans**.

### The knock-on

A fixed header means the hero owns the space under it. Their H1 sits at **y=250**
from the top of the document at 1440, of which 116px is the header. The hero
carries the rest as padding, and now measures:

| | theirs | mine (before) | mine (after) |
|---|---|---|---|
| header height | 116 | 113 | **116** |
| H1 top | 250 | 209 | **250** |
| hero CTA top | 486 | 449 | **490** |
| hero shot | 1200 @ 120 | 1200 @ 120 | **1200 @ 120** |

---

## 4. Checked, and what is still off

- `tsc --noEmit` clean, `next lint` clean.
- No horizontal overflow at 390 / 768 / 1024 / 1280 / 1440 / 1680.
- Header states verified by probing the running clone, not by reading the code.

Still different, deliberately:

- **Copy and imagery.** The page is in this product's voice with real captures
  of this app, so a whole-page pixel diff against theirs is meaningless and is
  not quoted here. Geometry is the thing that can be compared, and is.
- **The second card row is 70px shorter** than theirs (§1).
- **The logo strip.** Theirs names four customers. This one has none to name, so
  the strip carries the kinds of meeting the app handles instead.
- **The rating pill.** Theirs reads "Rated 4.8 / 5". There is nothing to rate.
