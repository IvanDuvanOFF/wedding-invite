# Свадебное приглашение

Single-page wedding-invitation mini-site, implemented in **Vue 3 + TypeScript + Vite**
from the *Wedding Design System* handoff (Claude Design).

The wedding: **19 сентября 2026**, Paradise Halls, Санкт-Петербург.

## Design language

A hand-made love note: terracotta brush ink (`--rust-600` #B23A22) on warm cream
paper (`--paper-100` #F5F1E9), deep forest green only for the sticky RSVP bar.
Three type voices — **Caveat** (display), **Marck Script** (doodled labels &
hand-written body), **Onest** (legible UI). Hand-drawn hearts, curved-arrow
annotations, tilted blobs and uneven sketch frames; no emoji, no gradients.

All design tokens live in [`src/styles/tokens.css`](src/styles/tokens.css),
reconstructed from the handoff's guideline cards and readme.

## Project structure

```
src/
  styles/tokens.css        design tokens (colour, type, radius, shadow, motion)
  components/
    HeartDoodle.vue        hand-drawn outline/filled heart
    AnnotationLabel.vue    script label + curved arrow
    AppButton.vue          terracotta pill CTA (solid/outline/ghost)
    BottomBar.vue          sticky forest-green RSVP bar
    RibbonTitle.vue        terracotta blob date banner
    PolaroidPhoto.vue      tilted polaroid print
    SketchFrame.vue        uneven double-stroke frame
    CountdownUnit.vue      one numeral + label of the countdown
    MonthCalendar.vue      month grid with the wedding day heart-circled
  App.vue                  the full single-scroll invite
```

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the dev server (Vite)
npm run build    # type-check (vue-tsc) + production build
npm run preview  # preview the production build
```

## Notes

- Photo slots are left as the design's dashed "здесь будет ваше фото" placeholders.
  The couple's reference photos are available in `public/photos/` if you want to
  drop them into a `PolaroidPhoto`.
- The map is a free OpenStreetMap embed tinted to the brand. To use MapTiler,
  swap the iframe `src` for a MapTiler embed URL with your API key.
- The original handoff bundle is kept under `design-handoff/` for reference.
