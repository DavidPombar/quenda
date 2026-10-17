# Design guidelines

Quenda is the municipal timetable for a town's courts, halls and pools. Its
visual language comes from that world, not from generic SaaS templates: the
white line markings on a court, the surface colours of each sport, and the
plain, legible signage of public buildings. It must feel like a well-run public
service: calm, direct and easy to read for everyone, from teenagers booking
padel to retirees booking the pool.

The same language applies to `frontend/web`, `frontend/app` and
`frontend/admin`; each workspace keeps its own copy of the tokens (no
cross-workspace imports). Accessibility target: WCAG 2.1 AA (T5).

## The one bold idea: sport surfaces as the colour system

Colour is information. Each sport owns the colour of its playing surface and
uses it consistently in tags, the timetable, illustrations and charts. The
rest of the interface stays white, ink and line-grey so those colours read.
The brand green is the municipal court green and is reserved for primary
actions, the current selection and the logo.

## Palette

| Token | Hex | Use |
| --- | --- | --- |
| `--paper` | `#ffffff` | Page and surfaces. No cream, no tinted page backgrounds. |
| `--ground` | `#f2f4f1` | The only secondary surface: sidebar, table headers, read-only fields. |
| `--line` | `#d8ddd6` | Court-line rules: borders, dividers, inputs. 1px. |
| `--ink` | `#14261d` | Headings and body text. |
| `--ink-2` | `#4a5a51` | Secondary text (≥ 7:1 on paper). |
| `--court` | `#1f5b43` | Brand: primary buttons, selection, links. |
| `--court-dark` | `#174634` | Hover/pressed primary. |
| `--court-tint` | `#e6efe9` | Selected rows/nav, free-slot fill. |
| `--ball` | `#e3ea4f` | Logo and the selected-slot marker only. Never text. |
| `--focus` | `#c25e00` | 3px focus outline. |

Sport colours (text-safe on white and on their tint, ≥ 4.5:1; use the tint
for fills):

| Sport | Colour | Tint |
| --- | --- | --- |
| Tennis (clay) | `#a3441d` | `#f8e7df` |
| Padel | `#1d5c9a` | `#e2ecf6` |
| Futsal (parquet) | `#8a5a1c` | `#f5ebdc` |
| Swimming | `#0f6f86` | `#dff0f4` |
| Other | `#4a5a51` | `#eceeeb` |

Status colours: available `--court`; maintenance `#8a5300` on `#fbefd9`;
closed / cancelled / error `#a3322a` on `#fae6e3`. Status is always written
as text; colour only supports it. Verify every pair with axe.

Forbidden: gradients (except the existing illustration mask), glows, coloured
shadows, tinted near-black, decorative tints behind icons.

## Typography

One family: **Atkinson Hyperlegible Next** (OFL-1.1, Braille Institute),
designed for low-vision readers. It is the public-service choice and it gives
Quenda its voice. Installed as `@fontsource-variable/atkinson-hyperlegible-next`
(weights 200–800); CSS family
`"Atkinson Hyperlegible Next Variable", system-ui, sans-serif`.

Scale (rem, root 16px):

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `--t-display` | clamp(2.5rem, 4vw + 1rem, 4rem) / 1.05 | 800, tracking -0.02em | Web hero only |
| `--t-1` | 2rem / 1.15 (1.625rem mobile) | 750, -0.015em | Page title (h1) |
| `--t-2` | 1.5rem / 1.25 | 700 | Section title (h2) |
| `--t-3` | 1.1875rem / 1.3 | 700 | Card / item title (h3) |
| `--t-body` | 1rem / 1.55 | 400 | Body, controls |
| `--t-small` | 0.875rem / 1.45 | 400–650 | Meta, labels, tags |
| `--t-tiny` | 0.8125rem / 1.4 | 500 | Only legal/footer lines |

- Sentence case everywhere. **No uppercase labels, no letter-spaced eyebrows.**
  A heading does not need a label above it.
- Times, prices, counts and KPIs use `font-variant-numeric: tabular-nums` and
  weight 700. Times in the timetable are the largest text in their cell.
- Line length ≤ 70ch for prose.
- Do not accent a single word in a headline with another colour or style.

## Shape, depth and structure

- Radii have a hierarchy: controls and tags 6px, cards, dialogs and
  illustrations 10px. No pills except the avatar circle and the language toggle.
- Structure with 1px `--line` rules first; use a card only when content is a
  separate, actionable object (a facility, a booking). Lists of things are lists
  with dividers, not grids of identical boxes.
- Shadows: none on cards at rest. One shadow only, for overlays
  (dialogs, menus): `0 12px 32px -12px rgb(20 38 29 / 28%)`.
- Icons: Phosphor (MIT) through `react-icons/pi`, regular weight; the
  filled weight only marks the active navigation item. Decorative icons get
  `aria-hidden`.
- No icon-in-a-tinted-square decoration. Icons appear inline with the text
  they clarify (18px, `--ink-2`), or not at all. No decorative leaf/sparkle icons.
- No coloured accent bars on a side of a rounded box (tags, notices, cards,
  panels). Tags and notices use a tint fill; cards use the 1px `--line` border.
- Numbered markers only for real sequences (the 3 booking steps are one).

## Components

- **Buttons**: 44px high (40px compact), 6px radius, weight 650, sentence case.
  Primary = solid `--court`; secondary = 1px `--line` border, ink text; tertiary
  = link style. The label says exactly what happens ("Reservar",
  "Gardar cambios"). No trailing arrows; use the external-link icon only for
  links that leave Quenda (mailto, licence, other sites). Moving between
  web/app/admin is ordinary navigation.
- **Inputs / NativeSelect**: 44px, 6px radius, 1px `--line` border, `--court`
  border on focus plus the focus ring; label above in 0.875rem/650.
- **Sport tag**: 6px radius, sport tint fill, sport colour text, 0.875rem/650.
  No border.
- **Status**: inline text with an icon (check, wrench, lock), not a pill.
- **Timetable slot**: free = `--court-tint` fill, `--court` time in 1.1875rem
  700 and the word "Libre"; selected = solid `--court`, white text, `--ball`
  3px top bar; booked/past = paper fill, dashed `--line` border, `--ink-2`
  text and its label. Today's past slots collapse behind a toggle.
- **Meta rows**: separate items with spacing and an icon, not middle dots.
  Never build strings like `A · B · C` in UI chrome.
- **Empty states**: illustration, one heading, one sentence, one action.
- **Dialogs**: 10px radius, 28px padding, title `--t-2`.
- **Focus**: 3px `--focus` outline, 3px offset, on every interactive element.

## Chakra UI theme

Every workspace has an identical `src/theme/system.ts` that maps these tokens
onto Chakra: `court` and green-tinted `gray` palettes, semantic `bg`/`fg`/
`border`, radii `control`/`card`, the single overlay shadow, and recipes for
buttons, inputs, selects, fields and dialogs (44px controls, 3px `--focus`
ring). Solid buttons always set `colorPalette`; outline and ghost buttons take
the palette's `fg` (gray = ink). Change the theme in all three copies at once;
do not override recipes from `styles.css`.

## Responsive

Breakpoints: 480, 768, 1024, 1280. Check 320, 390, 768, 1024 and 1440 with no
horizontal scroll. Below 1024 the app sidebar becomes a bottom tab bar; below
768 the municipality selector takes its own row. Below 480 dialog actions
stack with the primary action on top. Touch targets are at least 44px.

## Motion

Only in response to actions (dialog open, slot selected, toast). 150ms,
`cubic-bezier(.2,.7,.3,1)`. No hover lifts on cards, no entrance animations.
Respect `prefers-reduced-motion`.

## Copy

- Say what things are and do; don't sell. No two-part slogans
  ("Máis xogo. Máis vida.", "Menos X. Máis Y."), no "en movemento", no
  "para ti", no rhetorical headings.
- Titles name the content: "Instalacións de Portomar", "As túas reservas",
  "Actividade dos próximos 7 días".
- Citizen copy uses "ti", short and friendly; admin copy is neutral and precise.
- Errors state what happened and what to do. Empty screens invite one action.
- Local formats via `Intl` (`gl-ES` / `es-ES`): `3,00 €`, `xov 22`.

## Spacing

4px grid: 4, 8, 12, 16, 24, 32, 48, 64. Section rhythm on the public web:
`clamp(56px, 8vw, 96px)`. Whitespace replaces boxes and dividers.
