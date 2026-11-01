# Accessibility: WCAG 2.1 AA conformance matrix (T5)

T5 requires «conformidade co nivel AA da norma WCAG 2.1, consonte ao Real Decreto 1112/2018 e á
norma EN 301549» (bases, point 1.2), and section 4 of the official template asks for the «medidas
previstas e grao de cumprimento». This document is that degree of conformance: a
**self-assessment**, criterion by criterion, with its evidence and the open issues. It is not a
certification, and Quenda does not claim full conformance. The accessibility statement of each
municipality (#9) says «parcialmente conforme» until the pending reviews are done.

Last review: 2026-11-01 (issue #68), on `main` after #66.

## Legal frame

| Source | What it requires | Where Quenda covers it |
|---|---|---|
| **WCAG 2.1, levels A and AA** | 50 success criteria (30 A, 20 AA) | Matrix below |
| **EN 301 549 v3.2.1** (UNE-EN 301549:2022), chapter 9 | Web content: clause 9.x.y.z is WCAG 2.1 criterion x.y.z, word for word. Chapter 11 (software) and 12 (documentation) apply to the PWA and the help texts in the same way | The EN clause is shown in each row |
| **RD 1112/2018** (transposes Directive (EU) 2016/2102) | Arts. 5–6: meet EN 301 549. Art. 15: an accessibility statement for each site, with conformance status, non-accessible content, preparation date and review method. Arts. 10 and 12: a mechanism to report problems and request information, and a complaints procedure. Art. 16: review the statement at least once a year | Statement for each municipality at `/app/:slug/accesibilidade` and `/admin/:slug/accesibilidade`, plus the platform's statement at `/accesibilidade` (#9). The contact unit, email and phone come from municipal settings, but the backoffice cannot edit them yet (#76) |
| **Decision (EU) 2018/1524** | The two monitoring methods: **simplified** (automated tests on a sample of pages) and **in-depth** (manual review of all requirements on a sample of pages and processes) | The Observatorio de Accesibilidad Web applies the simplified method with its *Metodología de Seguimiento Simplificado UNE-EN 301549:2022*. It notes that the automated results are estimates and that an expert manual review of all UNE-EN 301549 requirements is always needed. Its reports are not the review report required by art. 17 of RD 1112/2018 |

## How each criterion is checked

- **Automatic**: axe-core 4.14 with the tags `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa`. It runs over 50
  screens and states in `npm run test:smoke` on every pull request (CI uploads the reports as
  `browser-evidence`), and fails on any violation not listed in `knownViolations` of
  `scripts/smoke-browser.mjs` (none today). The same script checks for page-level horizontal
  scroll at 320 and 390 px on seven screens.
- **Semi-automatic**: axe "incomplete" results, and checks that a tool measures but a person
  judges: reflow, text spacing and the accessibility tree. The `accesibilidade` skill
  (`.claude/skills/accesibilidade/SKILL.md`) runs them in a browser after every significant
  frontend change.
- **Manual**: keyboard paths, focus, the meaning of names and texts, time limits, and real
  assistive technology. Screen readers have not been tested yet (#77).

**Status values:**
- **Meets**: the evidence covers every screen where the criterion applies.
- **Partial**: it meets on the screens reviewed, but the full manual review is pending (#77).
- **Gap**: a known failure, with its issue.
- **N/A**: there is no content of that kind.

## Screens

The scans in `scripts/smoke-browser.mjs`, by name:

| Area | Screens and states (axe scan names) |
|---|---|
| Public website `/` | `website-desktop`, `website-mobile`, `website-search`, `accessibility-website` |
| Citizen app, signed out | `shared-catalog`, `shared-catalog-desktop`, `catalog`, `mobile`, `accessibility-app`, `bookings-signed-out`, `account-signed-out`, `unsubscribe`, `session-dialog`, `email-code`, `privacy-notice` |
| Citizen app, booking | `facility-page` (photo, map, opening hours), `resources-grid` (all courts), `confirmation`, `booking-success` |
| Citizen app, own bookings and account | `bookings-upcoming`, `access-pass` (QR), `change-booking`, `cancel-booking`, `history`, `history-mobile`, `open-data`, `account`, `delete-account` |
| Backoffice, manager | `admin-entry`, `admin-gate`, `management`, `management-mobile`, `facility-editor`, `courts-dialog`, `admin-bookings`, `admin-bookings-mobile`, `admin-insights`, `admin-categories`, `admin-settings`, `seasons`, `staff`, `audit-log`, `accessibility-admin` |
| Door page | `access-control` |
| Operator area | `operator-signed-out`, `operator-municipalities`, `operator-municipality-form`, `operator-manager-form`, `operator-insights`, `operator-web-analytics` |

These are **not scanned** yet, because the demo flow can't reach them:
- the municipal cancellation dialog: it appears only on days with bookings;
- the season reason dialog and the closure confirmation;
- staff sign-in with password and TOTP, and the temporary password dialog: they need `QUENDA_DATA_KEY`. Browser tests cover them in `staff.spec.tsx`.

Review them with the skill when they change.

## Matrix

Paths are relative to the repository. FD is
`frontend/app/src/pages/shell/components/catalog/components/facility-details`.

### Perceivable

| WCAG 2.1 | Lvl | EN 301 549 | Method | Status | Evidence and notes |
|---|---|---|---|---|---|
| 1.1.1 Non-text content | A | 9.1.1.1 | Auto + manual | Meets | axe `image-alt`, `svg-img-alt` and `role-img-alt` on 50 scans. Facility photos have their own alternative text (#26). Both QR codes are `role="img"` with a name, and the code is also given as text: `access-pass-dialog.view.tsx`, and in `staff-sign-in.view.tsx` with the TOTP secret in groups of four. Decorative icons are `aria-hidden` (design guidelines) |
| 1.2.1 Audio-only and video-only | A | 9.1.2.1 | — | N/A | No audio or video |
| 1.2.2 Captions (prerecorded) | A | 9.1.2.2 | — | N/A | No video |
| 1.2.3 Audio description or media alternative | A | 9.1.2.3 | — | N/A | No video |
| 1.2.4 Captions (live) | AA | 9.1.2.4 | — | N/A | No live media |
| 1.2.5 Audio description (prerecorded) | AA | 9.1.2.5 | — | N/A | No video |
| 1.3.1 Info and relationships | A | 9.1.3.1 | Auto + manual | Gap | **What meets:** landmarks; one `h1` per page; labelled fields; the slot grid is a `<table>` with an `sr-only` caption and `th scope` for times and courts (`FD/components/resource-grid/resource-grid.view.tsx`); `role="group"` with `aria-pressed` for days. **Gaps:** form errors not tied to their field (#72), and information only in `title` (#73) |
| 1.3.2 Meaningful sequence | A | 9.1.3.2 | Manual | Partial | The DOM order follows the visual order on the facility page (keyboard walk, 2026-11-01). Other screens not reviewed (#77) |
| 1.3.3 Sensory characteristics | A | 9.1.3.3 | Manual | Partial | No instruction found that relies on shape, colour or position. The texts were reviewed in `i18n.service.ts`, but not on every screen |
| 1.3.4 Orientation | AA | 9.1.3.4 | Code | Meets | No `orientation` in the manifests and no CSS or JS lock |
| 1.3.5 Identify input purpose | AA | 9.1.3.5 | Code | Meets | The only fields about the user themself carry `autocomplete`: `email` and `one-time-code` (`email-sign-in.view.tsx`); `username`, `current-password`, `new-password` and `one-time-code` (`staff-sign-in.view.tsx`). Staff and settings forms collect data about other people or the municipality, which this criterion doesn't cover |
| 1.4.1 Use of colour | A | 9.1.4.1 | Manual | Meets | Slot states are written as text («Libre» or the status) plus a border style (`FD/facility-details.view.tsx`, `styles.css` `.time-slot`). This rule is in `design-guidelines.md` |
| 1.4.2 Audio control | A | 9.1.4.2 | — | N/A | No audio |
| 1.4.3 Contrast (minimum) | AA | 9.1.4.3 | Auto + manual | Partial | axe `color-contrast` passes on 50 scans. Sport colours are at least 4.5:1 (design guidelines). Still to review by eye: text over photos and the map, which axe marks as incomplete |
| 1.4.4 Resize text | AA | 9.1.4.4 | Semi | Partial | No fixed font sizes in `px` for body text. A 640 px viewport (200 % zoom of 1280 px) works on the facility page. Other screens: #77 |
| 1.4.5 Images of text | AA | 9.1.4.5 | Manual | Meets | Only municipal logos (exempt as logotypes) |
| 1.4.10 Reflow | AA | 9.1.4.10 | Semi | Partial | No page-level horizontal scroll at 320 and 390 px on the website, its statement, the catalogue, history, the resource grid, day bookings, management and operator analytics (smoke test). Tables scroll inside their own region, which is allowed for two-dimensional content. The bottom bar has no room to spare (#75) |
| 1.4.11 Non-text contrast | AA | 9.1.4.11 | Manual | Partial | The focus ring is 3 px `#c25e00`. Borders of fields and slots haven't been measured |
| 1.4.12 Text spacing | AA | 9.1.4.12 | Semi | Partial | With the 1.4.12 stylesheet at 320 px, nothing is clipped on the facility page (skill, 2026-11-01). The risks are the fixed-height bottom bar, `overflow: hidden` on `.time-slot` and `nowrap` headers (#75) |
| 1.4.13 Content on hover or focus | AA | 9.1.4.13 | Manual | Gap | Information that exists only in `title` or a Leaflet tooltip (#73). No custom tooltips or toasts |

### Operable

| WCAG 2.1 | Lvl | EN 301 549 | Method | Status | Evidence and notes |
|---|---|---|---|---|---|
| 2.1.1 Keyboard | A | 9.2.1.1 | Manual | Partial | Native buttons, links and selects throughout. Leaflet `keyboard: true`. The grid region is focusable so it can scroll. A keyboard walk of the facility page and booking dialog works. Door page and backoffice: #77 |
| 2.1.2 No keyboard trap | A | 9.2.1.2 | Manual | Partial | Tab leaves the map and the grid. Chakra dialogs keep focus only while open: Esc closes them and focus returns to the opening control (booking dialog, 2026-11-01) |
| 2.1.4 Character key shortcuts | A | 9.2.1.4 | Code | Meets | No single-key shortcuts. Leaflet's keys work only while the map has focus |
| 2.2.1 Timing adjustable | A | 9.2.2.1 | Code | Gap | The email code (10 min), the staff sign-in ticket (10 min) and the session (8 h) give no warning and can't be extended (#71) |
| 2.2.2 Pause, stop, hide | A | 9.2.2.2 | Manual | Meets | No carousels, autoplay or moving content. Transitions last 150 ms and respect `prefers-reduced-motion` |
| 2.3.1 Three flashes | A | 9.2.3.1 | Manual | Meets | No flashing content |
| 2.4.1 Bypass blocks | A | 9.2.4.1 | Auto + manual | Gap | «Saltar ao contido» to `main#main` in the app, the backoffice, the operator area and the website. Missing on the backoffice home `/admin/` (#75) |
| 2.4.2 Page titled | A | 9.2.4.2 | Code | Gap | The website sets a title per page. The app and the backoffice keep a single title (#69) |
| 2.4.3 Focus order | A | 9.2.4.3 | Manual | Gap | The order is logical on the facility page. Focus is lost after a route change, after confirming a booking and between sign-in steps (#70) |
| 2.4.4 Link purpose (in context) | A | 9.2.4.4 | Auto + manual | Meets | axe `link-name` passes. Links are descriptive («Ver as miñas reservas», «Abrir no OpenStreetMap»). External links don't say they open a new tab (#74, advisory) |
| 2.4.5 Multiple ways | AA | 9.2.4.5 | Manual | Meets | Navigation, the catalogue search and sport filters, the municipality selector, and footer links. The backoffice has its main navigation |
| 2.4.6 Headings and labels | AA | 9.2.4.6 | Manual | Gap | Headings and labels describe their content. Leaflet's zoom controls are named in English (#74) |
| 2.4.7 Focus visible | AA | 9.2.4.7 | Manual | Meets | A 3 px `--focus` outline on all interactive elements (`frontend/*/src/styles.css`). Each `outline: none` has a replacement (`::after`, `:has`). Checked on the facility page |
| 2.5.1 Pointer gestures | A | 9.2.5.1 | Manual | Meets | The only multipoint or path gestures are map pan and pinch. Zoom buttons, the address in text and the OpenStreetMap link are alternatives |
| 2.5.2 Pointer cancellation | A | 9.2.5.2 | Code | Meets | Native `click` (activates on release). No `mousedown` actions |
| 2.5.3 Label in name | A | 9.2.5.3 | Auto + manual | Gap | Resource grid cells show «09:00 Libre» but are named «09:00, Pista 1, Libre» (#80). Leaflet's «+» is named «Zoom in» (#74) |
| 2.5.4 Motion actuation | A | 9.2.5.4 | — | N/A | Nothing reacts to device motion |

### Understandable

| WCAG 2.1 | Lvl | EN 301 549 | Method | Status | Evidence and notes |
|---|---|---|---|---|---|
| 3.1.1 Language of page | A | 9.3.1.1 | Auto + code | Meets | `lang="gl"` in the three `index.html`, updated on switching language (`document.documentElement.lang` in the shell controllers). axe `html-has-lang` and `html-lang-valid` pass |
| 3.1.2 Language of parts | AA | 9.3.1.2 | Manual | Gap | The language buttons and the legal texts carry `lang`. Leaflet's English control names have none (#74) |
| 3.2.1 On focus | A | 9.3.2.1 | Manual | Meets | No change of context on focus |
| 3.2.2 On input | A | 9.3.2.2 | Manual | Gap | The «Concello» selector navigates on `change` (#79). The day and court selects only update the grid on the same page, which is allowed |
| 3.2.3 Consistent navigation | AA | 9.3.2.3 | Manual | Meets | One shell for each app with the same navigation and footer on every page |
| 3.2.4 Consistent identification | AA | 9.3.2.4 | Manual | Partial | Shared components (Feedback, dialogs, slot buttons) and one i18n dictionary for each app. Not reviewed screen by screen |
| 3.3.1 Error identification | A | 9.3.3.1 | Manual | Gap | Errors are announced in `role="alert"` with specific texts. The sign-in forms don't tie the error to the field (#72) |
| 3.3.2 Labels or instructions | A | 9.3.3.2 | Auto + manual | Meets | Visible labels above fields, helper texts for format (code of 6 digits, login). axe `label` passes on 50 scans |
| 3.3.3 Error suggestion | AA | 9.3.3.3 | Manual | Meets | Messages say what happened and what to do («O código caducou… Pide outro», «Escribe un usuario de 3 a 64 letras…») |
| 3.3.4 Error prevention (legal, financial, data) | AA | 9.3.3.4 | Manual | Meets | Bookings show a confirmation step and can be changed or cancelled. Deleting the account, municipal cancellations and closures ask for confirmation in an `alertdialog` |

### Robust

| WCAG 2.1 | Lvl | EN 301 549 | Method | Status | Evidence and notes |
|---|---|---|---|---|---|
| 4.1.1 Parsing | A | 9.4.1.1 | — | Meets | React output. WCAG 2.2 marks this criterion obsolete, and axe `duplicate-id-aria` passes |
| 4.1.2 Name, role, value | A | 9.4.1.2 | Auto + manual | Gap | Native controls and Chakra components with ARIA. axe passes on 50 scans. The Leaflet marker takes focus without a name (#74). The sign-in fields don't expose `aria-invalid` (#72) |
| 4.1.3 Status messages | AA | 9.4.1.3 | Manual | Gap | `Feedback` uses `role="status"` or `alert`. The door page announces each scan with `aria-live="assertive"`. A confirmed booking and a change of day or court are not announced (#70) |

**Summary**:
- **Meets:** 20 criteria.
- **Partial:** 10 criteria.
- **Gap:** 13 criteria.
- **N/A:** 7 criteria.

The 13 gaps are tracked in #69–#76, #79 and #80. #77 is the pending manual review, and #78 is the slow sign-in code request (not a WCAG criterion).

## Points of special care

| Area | Finding |
|---|---|
| Slot grid and booking calendar | **Meets:** a real table, status as text, native buttons, and the booking dialog manages focus correctly. **Gaps:** booking success and grid changes are not announced (#70); cell names (#80) |
| Facility map | **Meets:** a keyboard-operable region with a name and a text alternative (the address and the OpenStreetMap link). **Gaps:** English zoom controls, a focusable marker without a name, the tooltip only on hover (#73, #74) |
| QR codes and the door page | **Meets:** the pass QR and the TOTP QR have a text alternative and the code is also given as text. The door page works without a camera (search and a check-in button for each booking) and announces results. **Not reviewed:** typing the printed code by hand |
| Sign-in dialogs (email code, password and TOTP) | **Meets:** `autocomplete` and `inputMode`. **Gaps:** time limits (#71), focus between steps (#70), errors tied to fields (#72). Separately, the code request waits for the mail server (#78) |
| Reflow and text spacing | Checked at 320 and 390 px on seven screens, and at 320 px with the spacing stylesheet on the facility page. Risks: #75 |
| Dark mode | Not supported. WCAG doesn't require it; the theme respects the system's reduced motion setting |

## Review and next steps

1. **Every change:** `npm run test:smoke` in CI, and the `accesibilidade` skill after significant frontend changes (CLAUDE.md, AGENTS.md).
2. **Fix the gaps:** #69–#76, #79, #80. Each fix updates its row here.
3. **Manual review with assistive technology** (NVDA, VoiceOver and TalkBack) of the main flows, and the screens not scanned above (#77).
4. **External review before a real pilot:** an independent in-depth review (UNE-EN 301549:2022, Decision (EU) 2018/1524) before a council publishes the service to residents. Until then each statement keeps «parcialmente conforme» and lists the open gaps.
5. **Annual review** of this matrix and of each statement's date (RD 1112/2018, art. 16).
