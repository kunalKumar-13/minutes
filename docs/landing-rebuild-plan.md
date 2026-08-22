# Landing page rebuild — element-by-element plan

Every number below is **measured** off fireflies.ai at a 1512px viewport with a
CDP probe (`getComputedStyle` + `getBoundingClientRect`), not eyeballed off a
screenshot. Where a value could not be captured it is marked *derived* and the
derivation is shown.

---

## 1. The three systemic faults

These are not section bugs. Each one is wrong on *every* section at once, which
is why fixing sections one at a time never moved the needle.

### 1.1 Radius — everything is too round

Radius histogram across their whole page:

| radius | count | what uses it |
|---|---|---|
| **4px** | 46 | every button, pill, tab, input |
| 8px | 9 | small media tiles, one ghost CTA |
| **12px** | 5 | feature cards |
| 16px | 1 | the one full-width banner |

Mine: `rounded-lg` (8px) on every button, `rounded-2xl` (16px) and `rounded-xl`
(12px) on every card. So **buttons are 2× too round and cards are 1.33× too
round**, everywhere, simultaneously.

### 1.2 Cards — mine are outlined boxes, theirs are tinted panels

Their cards, measured:

| size | radius | padding | background | border | shadow |
|---|---|---|---|---|---|
| 690×503 | 12px | 32px | `rgb(244,243,255)` violet | **none** | **none** |
| 486×503 | 12px | 32px | `rgb(255,250,235)` amber | none | none |
| 588×571 | 12px | 32px | `rgb(253,244,255)` fuchsia | none | none |
| 588×571 | 12px | 32px | `rgb(240,253,249)` mint | none | none |
| 486×273 | 8px | 0 | `rgb(14,5,57)` near-black | none | none |

Mine are `border border-gray-200 bg-white` / `ring-1 ring-gray-200`. **Grey-outlined
white rectangles.** That is the single largest visual difference on the page —
their colour comes from broad soft washes, mine comes from hairlines. It reads as
a wireframe next to a designed page.

Note also the **sizes**: 690/588/486 wide, 503–571 tall. Large paired panels, not
the 4-up grids of small cards I built.

### 1.3 Buttons — wrong radius, wrong font, wrong padding, wrong dark variant

| | theirs (measured) | mine |
|---|---|---|
| radius | **4px** | 8px |
| font | **DM Sans** 500 | Inter 500 |
| nav button | h40, **px 14** | h40, px 16 |
| large button | h48, **px 14 / py 12** | h48, px 24 |
| "Get Started" lg | **147×48** | 158×48 |
| primary bg | `rgb(122,90,248)` ✓ | ✓ correct |
| on-dark secondary | `rgba(241,241,249,.14)` **+ 1px `rgba(255,255,255,.08)`** | `bg-white/10`, no border |
| ghost lg | 207×50, r **8px**, px20/py14, 1px `rgba(255,255,255,.3)` | — |

My buttons are **too wide** (px-6 vs 14px) which is why they read as "here and
there" rather than sitting on a grid.

---

## 2. Footer — full spec

Their footer, measured: `height 799px`, `background rgb(0,0,0)`, `padding 64px 0`.

| element | measured | mine now |
|---|---|---|
| ground | **`#000000`** | `#0a0518` |
| padding | **64 / 64** | 80 / 40 |
| column heading | **18px / 500 / DM Sans / lh 20.16 / ls −0.36 / `rgb(250,250,250)`** | 16px / 600 / Inter / white |
| link | **14px / 400 / Inter / lh 20.16 / `rgba(250,250,253,0.78)`** | 16px / Inter / gray-400 |
| link gap | ~16px *(derived)* | 10px |
| heading → first link | ~32px *(derived)* | 20px |

*Derivation of the two gaps:* content height is 799 − 128 = 671px. The tallest
column is Product: 1 heading + 17 link line-boxes (one wraps), all on a 20.16px
line. So `20.16 + H + 17(20.16) + 16G = 671` ⟹ `H + 16G = 308`. Taking the
heading-gap : link-pitch ratio off the screenshot (58 : 40) gives pitch ≈ 36 ⟹
**G ≈ 16, H ≈ 32** — both round Tailwind steps, which is a good sign.

**Structure** (from their DOM, and it matches the screenshot): six headings
across five columns — Product (16), Use Cases (11), Integrations (7),
Company (6) + Learn (7), Download (4) + Contact & Help (3). My column shape is
already right; only the type and ground are wrong.

**Bottom bar:** mark + copyright left · language switcher centre · four social
icons right.

---

## 3. What I will not copy, and why

Two footer slots would require asserting something false:

- **The QR.** Theirs links to mobile apps. There are none here, so mine encodes
  the repository URL — a code that actually resolves.
- **The language switcher and social accounts.** There are no translations and
  no accounts. A dead switcher is worse than no switcher; that space carries the
  repo and demo links instead.

The connector lists stay labelled as roadmap rather than as working
integrations, because the app itself labels those surfaces unbuilt, and a
landing page that contradicts its own product is a bug.

---

## 4. Order of work

1. `primitives.tsx` — add a `Card` with the five measured tints; fix `CtaButton`
   to r-4 / DM Sans / 14px padding / bordered dark variant. *One edit, whole page.*
2. `SiteFooter.tsx` — rewrite to §2.
3. `MarketingNav.tsx` — button radius, padding, font.
4. Card-bearing sections — `StackSection`, `SecuritySection`, `KnowledgeSection`,
   `SkillsSection`, `TestimonialCarousel`, `FaqSection`, `AskSection` — swap
   outlined-white for tinted-borderless, r-12, p-32.
5. `FeatureSection` / `Shot` — radius and frame.
6. Re-run the probe and diff the numbers again.
