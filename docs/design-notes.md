# Reverse-engineering the Fireflies UI

The visual layer of this project isn't guesswork. Before writing any component I
pulled the design tokens straight out of the live Fireflies app and used them as
the Tailwind theme.

## How the tokens were obtained

`app.fireflies.ai` declares its whole design system as CSS custom properties on
`:root`. Loading the page in a headless browser and reading
`document.styleSheets` returns 209 of them. Those values were transcribed
verbatim into `frontend/tailwind.config.ts`.

## What came back

**Colour** — eleven 25→900 ramps (gray, purple, blue, indigo, red, green,
yellow, orange, pink, cyan, teal). The primary is `--color-purple-600: #6938ef`,
which is the exact purple on their Share button; `--color-purple-500: #7a5af8`
is the AI/accent tone.

**Type** — `--fontFamily-primary: 'DM Sans'` for titles,
`--fontFamily-secondary: Inter` for body. Sizes run 12/13/14/15/16/18/20/24/36/
48/64 against line heights 16/18/20/24/28/32/44/56/76, with a negative
letter-spacing ramp down to `-1.25px`. Both faces are loaded via `next/font`.

**Geometry** — radii `4 / 6 / 8 / 12 / 16 / 20 / 24 / 36 / 9999`; a 20-step
spacing scale; five elevations (`--elevation-1` … `--elevation-5`) plus a
`0 0 0 1px #6938ef` focus ring.

## Gradients

Gradients are the part of a brand hardest to approximate by eye, so none of
these were guessed. The tokens below are declared by the product's own
stylesheets; the rest were read off what it actually paints, or sampled pixel by
pixel from a rendered screen where the surface sits behind a login.

| Token | Value | Used for |
|---|---|---|
| `--interactive-gradient-default` | `linear-gradient(89deg, #ee82ee, #cf72fa 29.6%, #a165f9 65.95%, #7a5af8)` | Logo mark, AI affordances, send buttons |
| `--text-gradient` | `radial-gradient(565.43% 103.41% at 100% 50%, #7a5af8, #a165f9 34.05%, #cf72fa 70.4%, #eeaafd)` | Gradient text on dark |
| `--light-text-gradient` | `linear-gradient(45deg, #7a5af8, #fbe8ff)` | Gradient text on light |
| `--light-border-gradient-solid` | `linear-gradient(97deg, #7a5af8, #d444f1)` | Gradient borders |
| `--light-border-gradient-subtle` | `linear-gradient(97deg, #bdb4fe, #eeaafd)` | Softer gradient borders |
| `--dark-interactive-gradient-default` | `radial-gradient(circle at 50% 100%, #eeaafd, #cf72fa 29.6%, #a165f9 65.95%, #7a5af8)` | Brand fill on dark grounds |

Two more are not declared as tokens but are painted repeatedly:

- **The four-colour AI accent** — `linear-gradient(90deg, #577fff, #89ffcb 36%,
  #9c62ff 65%, #ffd28f)`. Blue → mint → violet → peach. This is the signature
  marker on anything a model produced: a 1px hairline under a heading, or the
  same ramp at `0.6` alpha, blurred, as a bloom behind a card.
- **The marketing CTA** — `linear-gradient(90deg, #6c31d9, #5d37f5 48.41%,
  #4013f2)`.

The Home greeting wash sits behind a login, so it was sampled from a rendered
screenshot rather than read from CSS: soft blue `#cedcf2` on the left, through
lavender `#e8e0e7`, to warm peach `#fbe7db` on the right, dissolving to white
about halfway down. It is reproduced as two stacked layers — the colour ramp,
and a white vertical fade over it.

Worth noting what is *not* a gradient: the assistant panel is plain white with
`gray-50` chips. An earlier version of this clone invented a purple wash there,
which is the kind of small confident wrong detail that makes a copy feel off.

## Layout, read off the product screenshots

Fireflies publish product screenshots of the meeting view on their marketing
site. Those shots are not redistributed here, but the layout they show is the
one this clone reproduces:

- A 60px top bar: hamburger, `#channel / Meeting title` breadcrumb, a `REC`
  pill, then a purple **Share** button and the account avatar on the right.
- A 60px icon rail down the left for the meeting's own tools.
- Notes on the left, transcript on the right, split by a single hairline.
- Notes are ordered **Overview → Notes → Action Items → Meeting Outcome**, where
  each Notes chapter is `emoji Title MM:SS - MM:SS` followed by `·` bullets, and
  action items are grouped under an assignee's name with a timestamp link.
- Transcript lines are `avatar · Name ⌄ · 00:53` with the timestamp in blue and
  underlined, and the body in 16px at a generous line height.

## What is deliberately different

The logo is drawn as original inline SVG rather than copying their trademark
asset, and all sample content is written from scratch. Fireflies' own dark shell
(sampled from their login page: `#0c0d0f` ground, `#232426` cards,
`rgba(255,255,255,0.06)` hairlines) is reproduced as this app's dark theme.
