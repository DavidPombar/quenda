@AGENTS.md

## Claude Code

- `.claude/launch.json` starts the development stack (`quenda-dev`, `npm run dev` on
  http://127.0.0.1:5173) for the built-in browser; the database needs `npm run setup` once.
- Accessibility (T5): after a significant change in `frontend/app`, `frontend/admin` or
  `frontend/web` — a new screen or dialog, a shared component, the theme or a `styles.css`, the
  booking flow or a sign-in flow — run the `accesibilidade` skill before finishing, without
  waiting to be asked, and report its result. The criteria and their status are in
  `docs/architecture/accessibility.md`.
