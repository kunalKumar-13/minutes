# The logged-in app, measured

Everything here was read off the live `app.fireflies.ai` at a 1600×1000 viewport
via CDP — computed styles and `getBoundingClientRect()`, not eyeballing. It is
the specification the app shell in this repo is built to.

## Shell geometry

| Region | Position | Size | Background | Border |
|---|---|---|---|---|
| Announcement bar | `0, 0` | `100% × 40` | `#f4f3ff` (purple-50) | — |
| Icon rail | `0, 40` | `65 × 100%` | `#ffffff` | `1px` right |
| Channel sidebar | `65, 40` | `250 × 100%` | `#fcfcfd` (gray-25) | `1px` right |
| Content top bar | `315, 40` | `flex × 52` | `#ffffff` | `0.5px` bottom |
| Ask Fred panel | right | `~430 × 100%` | `#ffffff` | `1px` left |

The channel sidebar is **contextual**: Meetings shows it, Home does not.

## Typography

The app shell and the marketing site use different stacks — worth knowing,
because using the marketing font in the app is exactly what makes a clone feel
"close but wrong".

- **App:** `Roboto, Poppins, "Open Sans", "Helvetica Neue", Helvetica, Arial`
- **Marketing + login:** `DM Sans` for display, `Inter` for body

## Palette in use

Same token set documented in [design-notes.md](design-notes.md), and these are
the ones the app actually leans on:

| Token | Hex | Where |
|---|---|---|
| purple-600 | `#6938ef` | Capture button, active nav |
| purple-700 | `#5925dc` | Capture hover / pressed |
| purple-50 | `#f4f3ff` | Announcement bar, active nav tint |
| blue-500 | `#2e90fa` | Links and transcript timestamps (the single most-used accent) |
| gray-25 | `#fcfcfd` | Sidebar ground |
| gray-500 | `#667085` | Secondary text |
| gray-600 | `#475467` | Body text |
| gray-900 | `#101828` | Headings |

## Icon rail, top to bottom

Logo · Home · AskFred (`⌘J`) · Meetings · Meeting Status · Uploads ·
Integrations · Analytics — divider — Voice Agents · AI Skills · Team ·
Upgrade · Settings · More. Items are 40×36 hit targets on a 65px rail.

## Real routes

| Path | Screen |
|---|---|
| `/` | Home dashboard |
| `/ask-fred` | Ask Fred |
| `/notebook/mine-shared` | My Meetings |
| `/notebook/all` | All Meetings |
| `/notebook/autopilot` | Voice Agent Meetings |
| `/status` | Meeting Status |
| `/upload` | Uploads |
| `/integrations` · `/analytics` · `/agents` · `/skills` | as named |
| `/settings/meeting-recording` · `/settings/team/members-and-groups` | Settings |

This clone mirrors them, with one deliberate difference: `/` is the public
marketing site and the app home lives at `/home`, because a visitor who is not
signed in has to land somewhere.

## Screens

**Home** — a soft blue→peach gradient header, `Good Afternoon, {name} ☀️`, a
"Personal Assistant" row of three cards (Daily Brief, Meeting Prep, Tasks), a
Connect-integrations banner, then `Recent / Upcoming / AI Feed` segmented tabs
over a compact meeting list, ending in an "All caught up!" pill.

**Meetings** — channel sidebar (`My Meetings`, `All Meetings`,
`Voice Agent Meetings`, then an `All channels` section with an empty state and
a `+ Channel` button); content shows `Hosted by me ×` / `Shared with me` filter
pills, a `Filters` button, and the meeting list.

**Ask Fred** — pinned right. Header with avatar, a connect-integrations promo
card, a greeting over a soft gradient, suggestion chips, and a composer reading
"Ask anything. Type / to run AI skills."

> Reference screenshots of the signed-in account are **not** stored in this repo:
> they contain a real person's meeting data. This document is the artefact.
