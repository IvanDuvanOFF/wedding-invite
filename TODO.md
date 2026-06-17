# TODO

Open items for the Гордей & Елизавета wedding invite. Checked = done.

## Blocked on info from the couple

- [ ] **Telegram link for the host.** The contacts paper-plane icon currently
      links to `https://t.me/` as a placeholder (App.vue, `.tg-link`). Swap in
      the host's real username (`https://t.me/<username>`) once provided.
- [ ] **Photos.** Hero and closing sections still show the dashed
      «здесь будет ваше фото» placeholders. Real couple photos live in
      `public/photos/` — drop them into `PolaroidPhoto` (or the placeholder
      boxes) when the couple picks final images.

## Needs a product decision

- [ ] **RSVP submission.** The form is currently local-only — submitting just
      shows the thank-you screen; `name` / `coming` / `where` / `companions` /
      `drinks` are not persisted or sent. Decide on a target and wire it up:
      backend endpoint, Google Sheet, or a Telegram bot. Add basic
      success/error handling once chosen.
- [ ] **RSVP validation feedback.** `submit()` silently no-ops if name or
      attendance is missing. Consider inline validation hints.

## Content to confirm

- [ ] **Venue address / map.** Set to «Paradise Halls, ул. Ноябрьская 61,
      Кемерово» with an OpenStreetMap embed centred on the geocoded
      «Парадайз ресторан» (55.37589, 86.16077). Confirm this is the correct
      venue; to switch to MapTiler, swap the iframe `src` + add an API key.
- [ ] **Host contact.** «Ведущий Илья», `tel:+79235022070` — confirm name and
      number are final.

## Nice-to-have / polish

- [ ] Restaurant logo is rendered as an ink stamp (`mix-blend-mode: multiply`
      over paper, circular clip). If a vector/transparent-PNG logo becomes
      available, use it for a cleaner terracotta-tinted mark.
- [ ] `prefers-reduced-motion`: countdown + transitions are gentle, but consider
      honouring reduced-motion for the nav hide/scroll behaviour.
- [ ] Consider extracting the large `App.vue` into per-section components if it
      keeps growing.
