# Mobile App Design Upgrade Plan

Goal: take the app from "renders content" to a polished, professional reading
app that feels like the website's sibling — with a proper theme system:
starts in the phone's mode, and a button to switch light/dark manually.

## Diagnosis (from device screenshots)

1. **Cards are invisible in dark mode** — card `#171f1c` on background
   `#101a17` with a faint border reads as plain text on a black page. No
   surfaces, no depth, no grouping.
2. **No hierarchy** — screen titles, card titles, and body text are too close
   in size/weight; eyebrow labels and pills carry all the structure.
3. **No identity** — no brand mark, no icons, no accent presence; nothing
   signals "this is The Straight Path".
4. **No affordances** — tappable rows look identical to static text; no
   chevrons, no pressed states.
5. Theme follows the system (correct) but there is **no manual override**.

## Phase 1 — Theme system + toggle (foundation)

- `ThemeProvider` (React context): `mode: "system" | "light" | "dark"`,
  persisted to AsyncStorage. Resolved theme = system scheme when mode is
  "system" — so first launch always matches the phone.
- Header button on every screen: sun/moon icon cycling light ↔ dark
  (long-press or third state returns to "system").
- Design tokens in one module: spacing scale (4/8/12/16/20/24), radii
  (10/14/18), type scale (28/20/17/15/13/11 with weights), shadows.
- **Fix the dark palette**: lift card surface to ~`#1a2420`, border
  `#2e3b36`, add iOS shadow / Android elevation so cards read as cards.

## Phase 2 — Core component kit

- `Screen` — themed background + safe-area + consistent padding.
- `Card` — real surface (bg + border + radius 14 + shadow), generous
  padding, pressed state (opacity/scale).
- `IconBadge` — tinted rounded square with an Ionicons glyph (accent at
  ~14% opacity background), mirroring the website's TopicCard icon boxes.
- `ListRow` — icon badge + title + subtitle + chevron; hairline separators.
- `SectionHeader` — eyebrow (uppercase, tracked, accent) + optional action.
- `Pill` / `StatusPill` — tuned tints per status (gold draft, teal
  published), consistent height.
- Category icon map: scripture→book, jesus→heart, preservation→shield,
  questions→help-circle, science→flask, history→time, theology→scale,
  salvation→compass, prophecies→sparkles, glossary→reader, sources→library.

## Phase 3 — Screen-by-screen polish

- **Home**: real hero — brand mark (app icon), name + Arabic (RTL), tagline
  on a subtly tinted band; main paths as icon rows with chevrons; numbered
  learning-path steps in accent circles; bookmarks section with empty state.
- **Library**: icon rows (ListRow) instead of text blocks; Sources pinned
  as a distinct reference row.
- **Search**: icon inside the field, clear (×) button, result count line,
  polished empty state.
- **Glossary**: term cards with pronunciation line and related-term chips.
- **Article reader**: reading-first typography (17/28 body option), section
  eyebrow + rule, citation cards with type icon + status, related-article
  rows, bookmark + font-size actions kept in header.
- **Category / Section tree**: header block with icon badge + description;
  tree branches as grouped cards with clear expand affordance.
- **Sources**: grouped by category with sticky-feeling section headers.

## Phase 4 — Platform polish + verification

- Tab bar: filled icon when active (home vs home-outline), label weight,
  safe-area bottom padding.
- Pressed states everywhere; `hitSlop` on small controls.
- Large-title headers on iOS where natural (Home, Library).
- Verify BOTH themes: expo web export + Playwright screenshots (light and
  dark), plus live check on the phone via Expo Go hot reload.
- Commit per phase.

## Non-goals (unchanged scope)

Arabic UI locale, push notifications, and the comparison-article layout stay
post-v1 (see README).
