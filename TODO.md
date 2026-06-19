# TODO

Open items for the Гордей & Елизавета wedding invite. Checked = done.

## Blocked on info from the couple

- [x] **Contacts now use VK (not Telegram).** The contacts icon is the VK
      monogram (`VkLogo.vue`, `.vk-link`) linking to the host's page
      (`vkPageUrl` = `https://vk.ru/i_andreev_tut`). A "Чат гостей" card sits
      just above the host contacts with a "Вступить" button opening the guest
      chat (`vkChatUrl` = `https://vk.me/join/…`). Both links live as consts in
      App.vue — swap there if they change.
- [x] **Photos.** Hero shows `public/photos/child-photo.png` (childhood photo,
      1:1 frame, `object-fit: cover`); the closing section shows
      `public/photos/polaroid-photo.jpg` (4/5 frame). Placeholder boxes removed.
      The «жених/невеста» annotation labels were swapped to match the hero photo
      (bride left, groom right). Swap the files in `public/photos/` to change
      images; keep the hero ratio in sync with the photo (currently square).

## RSVP backend — code done, needs one-time setup

- [x] **RSVP submission wired up.** `submit()` POSTs `name` / `coming` / `where`
      / `companions` / `drinks` to a Google Apps Script web app
      (`VITE_RSVP_ENDPOINT`), with sending/error states + a honeypot. Falls back
      to local-only when the env var is unset. Code: `server/apps-script/`.
- [x] **RSVP validation feedback.** Confirm is always tappable (disabled only
      while `sending` or after the deadline); the label shows `(･_･?)` until a
      choice is made. Tapping with missing name/attendance shows an inline hint
      «плашка» (`formHint` + `attempted`) instead of silently no-opping.
- [x] **RSVP deadline.** Submissions close after end of **15 July 2026**
      (`deadlinePassed`): the button disables and a notice appears. The date is
      underlined in the form subtitle (`.deadline-date`).
- [ ] **Deploy the Apps Script + set the URL.** Follow
      `server/apps-script/README.md`: create the Sheet + bot, add Script
      Properties (`TELEGRAM_TOKEN`, `TELEGRAM_CHAT`), deploy the web app, then
      set the `/exec` URL as repo Actions Variable `VITE_RSVP_ENDPOINT` (and in
      `.env.local` for local testing). The Telegram notification is now an
      HTML-formatted message (`parse_mode: HTML`, escaped fields, mood emoji).

## Content to confirm

- [ ] **Venue address / map.** Set to «Paradise Halls, ул. Ноябрьская 61,
      Кемерово» with an OpenStreetMap embed centred on the geocoded
      «Парадайз ресторан» (55.37589, 86.16077). Confirm this is the correct
      venue; to switch to MapTiler, swap the iframe `src` + add an API key.
      (OSM's bottom attribution bar is clipped via `overflow: hidden`; the
      required credit is kept as a `.map-credit` caption below the frame.)
- [ ] **Host contact.** «Ведущий Илья», `tel:+79235022070` — confirm name and
      number are final.
- [x] **ЗАГС wording.** Ceremony row reads «Торжественная церемония в ЗАГСе
      Ленинского района». Confirm the district is correct.

## Nice-to-have / polish

- [ ] Restaurant logo is rendered as an ink stamp (`mix-blend-mode: multiply`
      over paper, circular clip). If a vector/transparent-PNG logo becomes
      available, use it for a cleaner terracotta-tinted mark.
- [ ] `prefers-reduced-motion`: countdown + transitions are gentle, and the
      «Спасибо» fireworks already opt out; consider also honouring it for the
      nav hide/scroll behaviour.
- [ ] Consider extracting the large `App.vue` into per-section components if it
      keeps growing.
