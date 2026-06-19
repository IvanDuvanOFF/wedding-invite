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
npm run dev      # Vite dev server on port 5176 (vite.config.ts server.port,
                 #   strictPort; matches .claude/launch.json + Preview tools)
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
  when, where, schedule, dress-code/palette, countdown, guest-chat (VK), host
  contacts, RSVP, closing, sticky CTA). Section layout is **inline styles** copied faithfully from the
  design; **scoped `<style>`** is used only where inline can't reach: media
  queries (responsive), `:hover`, pseudo-elements, transitions.
- `src/components/*.vue` — the design-system primitives, ported 1:1 from the
  handoff's React components:
  `AppButton`, `BottomBar`, `RibbonTitle`, `PolaroidPhoto`, `SketchFrame`,
  `HeartDoodle`, `AnnotationLabel`, `CountdownUnit`, `MonthCalendar`, plus
  `VkLogo` (single-colour VK monogram via `currentColor`, styled as terracotta
  ink — used for the contacts link + the guest-chat button).
  (`BottomBar`, `PolaroidPhoto`, `CountdownUnit` exist as library components but
  the page currently inlines those patterns; keep them valid — `vue-tsc -b`
  type-checks all `.vue` files.)
- `public/photos/` — `child-photo.png` (hero: the couple as kids dressed as
  bride/groom — **square**, drives the 1:1 hero frame), `polaroid-photo.jpg`
  (closing section, 4/5 frame), `restaurant-logo.jpg`, `color-palette.jpg`.
  Wire each in base-aware via the `heroPhotoUrl` / `polaroidPhotoUrl` / `logoUrl`
  consts in App.vue. The hero's «жених/невеста» annotation labels are ordered
  bride-left / groom-right to match `child-photo.png`; keep them in sync if the
  photo changes.

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
- "Where" map: the OSM embed's bottom attribution bar (cramped on mobile) is
  **intentionally clipped** — the iframe is `calc(100% + 48px)` tall inside a
  fixed-height `overflow: hidden` frame. The required credit is preserved as the
  `.map-credit` caption below it, so don't "fix" the clip by shrinking the
  iframe.

## Contacts & guest chat (VK, not Telegram)

The site links out to **VK** only (the host doesn't use Telegram). Two consts in
App.vue hold the URLs: `vkPageUrl` (host's page, the contacts-section icon) and
`vkChatUrl` (the `vk.me/join/…` guest-chat invite behind the "Чат гостей" card's
"Вступить" button, which calls `openVkChat`). The VK mark is `VkLogo.vue` in
terracotta ink (`.vk-link` for the contacts icon). The Telegram bot in the RSVP
backend is unrelated — that's a server-side notification, not a user-facing link.

## RSVP form (state in App.vue)

`name`, `coming` (`yes`/`no`/`null`), `where` (zags/banquet/both), `companions`
(string[] via "Добавить спутника"), `drinks` (optional), plus a hidden
`honeypot` spam trap. Extra fields show only when `coming === 'yes'`. Schedule
rows are clickable → scroll to form + pre-select venue.

The Confirm button is **always tappable** (disabled only while `sending` or
after the deadline) — its label is the `(･_･?)` kaomoji until a choice is made.
Submitting with a missing name/attendance sets `attempted` and surfaces an
inline hint «плашка» (`formHint`) instead of silently no-opping. Submissions
**close after end of 15 July 2026** (`deadlinePassed`): the button disables, a
notice shows, and the deadline date is underlined in the subtitle
(`.deadline-date`). On success the «Спасибо» card shows a CSS fireworks burst
**only when the guest is coming** (`coming === 'yes'`, opts out under
`prefers-reduced-motion`); a "no" answer shows a warmer «передумаете» message.

`submit()` POSTs the payload to a **Google Apps Script web app** at
`import.meta.env.VITE_RSVP_ENDPOINT` (server source + setup in
`server/apps-script/`). The server appends a Sheet row and sends an
HTML-formatted Telegram message (`parse_mode: HTML`, fields escaped via `esc()`,
mood emoji by attendance) — `notifyTelegram` in `Code.gs`. It's a `no-cors` request (Apps Script sends no CORS
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
