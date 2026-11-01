---
name: accesibilidade
description: Check WCAG 2.1 AA (T5) in Claude Code's built-in browser after a significant change in frontend/app, frontend/admin or frontend/web — a new screen or dialog, a shared component, the theme or styles.css, the booking flow or a sign-in flow. Runs axe, keyboard, accessibility-tree, zoom, reflow and text-spacing checks and reports against docs/architecture/accessibility.md.
---

# Accessibility check in the browser (T5)

Quenda must meet WCAG 2.1 AA (RD 1112/2018, EN 301 549). axe finds only part of the
failures, so this check adds the manual parts. The criteria, their status and the known gaps are
in `docs/architecture/accessibility.md`; read it first.

Run it after any significant frontend change without being asked: a new screen or dialog, a
shared component, the theme or a `styles.css`, the booking flow or a sign-in flow. Small copy or
logic changes don't need it; `npm run test:smoke` still covers them.

## 0. Start

- Database ready (`npm run setup` once) and the dev server running: `preview_start` with the
  `quenda-dev` configuration of `.claude/launch.json` (`npm run dev`). One origin,
  `http://127.0.0.1:5173`, serves the website `/`, the citizen app `/app/`, the backoffice
  `/admin/` and the API.
- Sign in with the demo buttons (`DEMO_MODE=true` in development): **Entrar**, accept the privacy
  notice, then *Entrar como cidadanía*, *Entrar como xestor/a* or *Entrar como control de
  accesos*. Demo municipalities: `portomar`, `vilaverde`.
- Make a list of the affected screens and dialogs (route, state, role). Check each one at
  **375 × 812** (`resize_window` preset `mobile`) and at **desktop** width, and reset with the
  `desktop` preset at the end.

## 1. axe

Inject axe-core from the repository through Vite and run it with the T5 tags:

```js
await new Promise((resolve, reject) => {
  if (window.axe) return resolve();
  const script = document.createElement("script");
  script.src = "/@fs/<absolute path of the repository>/node_modules/axe-core/axe.min.js";
  script.onload = resolve;
  script.onerror = reject;
  document.head.append(script);
});
const result = await axe.run(document, {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
});
result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) }));
```

Run it with `javascript_tool` once the screen has settled (dialog open, data loaded). If the
script is blocked (another origin, CSP), use the headless fallback:
`node scripts/axe-page.mjs <url> [--mobile]`, which also writes `.dev-logs/axe-page.json`.

Compare with the last smoke reports in `.dev-logs/axe-*.json` (`npm run test:smoke`). Any
violation not listed in `knownViolations` of `scripts/smoke-browser.mjs` is new.

## 2. Keyboard (2.1.1, 2.1.2, 2.4.3, 2.4.7)

With `computer` `key` actions (`Tab`, `shift+Tab`, `Enter`, `space`, `Escape`, arrows), and a
screenshot after each few steps:

- every control is reachable, in an order that follows the page, with the 3 px focus ring;
- no trap: Tab leaves every widget (map, grid regions, dialogs only while open);
- dialogs: focus moves inside on open, Esc closes, focus returns to the control that opened it;
- after a step changes the content (route change, form step, booking done), say where focus
  went. `document.activeElement` via `javascript_tool` helps.

## 3. Accessibility tree (1.1.1, 1.3.1, 2.4.6, 3.3.2, 4.1.2, 4.1.3)

`read_page` on the screen and check:

- one `h1`, headings in order, landmarks (`banner`, `navigation`, `main`, `contentinfo`) and the
  skip link;
- every button, link and field has a name that says what it does; fields have visible labels;
- images and QR codes have a text alternative; decorative icons are hidden;
- results, errors and confirmations use `role="status"` or `role="alert"` and are present after
  the action;
- the page title (`document.title`) names the screen (2.4.2).

## 4. Zoom, reflow, spacing and contrast (1.4.3, 1.4.4, 1.4.10, 1.4.11, 1.4.12)

- **Reflow:** `resize_window` 320 × 640. No horizontal scroll of the page:
  `document.documentElement.scrollWidth > innerWidth` must be `false`. Tables and the slot grid
  may scroll inside their own region.
- **200 % zoom:** a 1280 px window at 200 % is a 640 px viewport; check at 640 × 800 that nothing
  overlaps or is cut off.
- **Text spacing:** inject this style and look for clipped or overlapping text:

  ```js
  const s = document.createElement("style");
  s.textContent = "*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}";
  document.head.append(s);
  ```

- **Contrast:** axe covers text; check by eye the focus ring, borders of inputs and slot states
  (3:1) and that no state depends on colour alone (1.4.1).
- Information that only appears on hover (`title`, tooltips) must also be available on focus or
  as text (1.4.13).

## 5. Report

End with:

- the screens checked, at which sizes, with a screenshot of each problem;
- a table: WCAG criterion → result (OK / problem) → evidence (screen, element, axe rule);
- new problems: propose an issue for each (Spanish, label `accessibility`, link to the
  criterion in `docs/architecture/accessibility.md`), and fix them in the current change when
  they come from it;
- update the matrix in `docs/architecture/accessibility.md` when a criterion's status or
  evidence changes.

Never state that Quenda is WCAG certified or fully conformant: only the self-assessed degree of
conformance.
