# CLAUDE.md

Guidance for AI agents working in this repo.

## What this is

A single-page **wedding-invitation mini-site** for **Гордей & Елизавета**
(wedding: **19 September 2026, 14:30**, Paradise Halls, ул. Ноябрьская 61,
Кемерово). Built **Vue 3 + TypeScript + Vite**. Russian-language UI.

It was implemented from a **Claude Design handoff** (a HTML/CSS/JS design-system
bundle), kept under `design-handoff/` for reference. The design medium was
prototypes; this repo is the real implementation — match the visual output, not
the prototype's internal structure.

## Commands

```bash
npm install      # deps
npm run dev      # Vite dev server (port 5176 via .claude/launch.json)
npm run build    # vue-tsc type-check + production build  ← run before finishing
npm run preview  # serve the production build
npm run typecheck
```

Always run `npm run build` after changes — it type-checks with `vue-tsc` under
strict mode (`noUnusedLocals`, `verbatimModuleSyntax`, etc.). Use `import type`
for type-only imports.

## Architecture

- `src/styles/tokens.css` — **the single source of design truth**. All colour,
  type, radius, shadow, motion tokens as CSS custom properties. Reconstructed
  from the handoff's guideline cards (the original `tokens/*.css` were not in the
  bundle). Change brand values here, not in components.
- `src/App.vue` — the entire page. All sections live here (nav, hero, greeting,
  when, where, schedule, dress-code/palette, countdown, contacts, RSVP, closing,
  sticky CTA). Section layout is **inline styles** copied faithfully from the
  design; **scoped `<style>`** is used only where inline can't reach: media
  queries (responsive), `:hover`, pseudo-elements, transitions.
- `src/components/*.vue` — the design-system primitives, ported 1:1 from the
  handoff's React components:
  `AppButton`, `BottomBar`, `RibbonTitle`, `PolaroidPhoto`, `SketchFrame`,
  `HeartDoodle`, `AnnotationLabel`, `CountdownUnit`, `MonthCalendar`.
  (`BottomBar`, `PolaroidPhoto`, `CountdownUnit` exist as library components but
  the page currently inlines those patterns; keep them valid — `vue-tsc -b`
  type-checks all `.vue` files.)
- `public/photos/` — couple reference photos, `restaurant-logo.jpg`,
  `color-palette.jpg`.

## Design language (do not drift)

- **One warm voice:** terracotta brush ink (`--rust-600` #B23A22, exposed as
  `--accent`) on cream paper (`--paper-100`). Forest green (`--forest-900`) is
  used **only** for the sticky bottom CTA.
- **Three fonts:** Caveat (`--font-display`, headings/numerals), Marck Script
  (`--font-script`, doodled labels & romantic body), Onest (`--font-body`, UI).
  Loaded via Google Fonts in `index.html`.
- Hand-drawn motifs: hearts, curved-arrow annotations, tilted blobs, uneven
  sketch frames, the garland of letter-cards hung on a rope. **No emoji in the
  brand chrome, no gradients-as-decoration, no glassmorphism.** (Kaomoji like
  `^-^` / `\^o^/` on buttons are intentional copy, not brand iconography.)
- Copy is warm Russian, couple's first-person plural, guests addressed as «вы».

## Responsive conventions

- Breakpoint is **760px** (`@media (max-width: 759px)` mobile / `(min-width:
  760px)` landscape-desktop).
- Mobile nav is a left-aligned **burger** that hides on scroll-down / shows on
  scroll-up (`navHidden` ref + `onScroll`); the hide transform is gated to the
  mobile media query so desktop never hides.
- "When" section: stacked date + down-arrow on mobile; horizontal date +
  right-arrow connector → calendar on desktop.
- Palette swatches: 2×4 on mobile (smaller dots), 4×2 on desktop; hex revealed
  on hover/active.

## RSVP form (state in App.vue)

`name`, `coming` (`yes`/`no`/`null`), `where` (zags/banquet/both), `companions`
(string[] via "Добавить спутника"), `drinks` (optional), plus a hidden
`honeypot` spam trap. Extra fields show only when `coming === 'yes'`. Schedule
rows are clickable → scroll to form + pre-select venue.

`submit()` POSTs the payload to a **Google Apps Script web app** at
`import.meta.env.VITE_RSVP_ENDPOINT` (server source + setup in
`server/apps-script/`). It's a `no-cors` request (Apps Script sends no CORS
headers), so the response is opaque — success is optimistic, only network
errors flip `failed`. States: `sending` / `sent` / `failed`. **If
`VITE_RSVP_ENDPOINT` is unset (e.g. local dev), it falls back to the old
local-only behaviour** (just shows the thank-you screen). The endpoint URL is
set via repo Actions Variable for CI and `.env.local` locally.

**Status (as of setup):** the Apps Script project (`wedding-list`) is deployed
as a web app and authorized (Sheets + external-service scopes); the Telegram bot
lives in a group, with `TELEGRAM_TOKEN` / `TELEGRAM_CHAT` in Script Properties.
The remaining connection is the `VITE_RSVP_ENDPOINT` repo Actions Variable —
production posts to the live backend only once that's set (verify in repo
Settings → Secrets and variables → Actions → Variables, then re-run the deploy).

## Deployment

`.github/workflows/deploy.yml` builds and publishes to **GitHub Pages on every
push to `master`** (build + deploy jobs using the official Pages actions).

GitHub Pages serves a project site from `/<repo>/`, so the CI sets
`BASE_PATH=/<repo>/` and `vite.config.ts` reads it into Vite's `base` (defaults
to `/` locally). **Any reference to a `public/` asset must be base-aware** — use
`` `${import.meta.env.BASE_URL}photos/…` `` (see `logoUrl` in App.vue), never a
hardcoded `/photos/…`, or it 404s under the Pages subpath. Requires Pages to be
enabled with **Source: GitHub Actions** in the repo settings.

## Verifying

Use the Claude Preview tools (`.claude/launch.json` defines the `wedding-invite`
server on port 5176). Check both mobile (375px) and a wide desktop (≥1100px),
since the 760px breakpoint changes several sections.
