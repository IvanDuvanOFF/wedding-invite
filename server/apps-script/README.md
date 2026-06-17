# RSVP backend — Google Apps Script

This folder holds the source for the RSVP backend (kept in the repo for version
control). Apps Script is **not deployed from the repo** — you paste `Code.gs`
into the Apps Script editor and deploy from there. Do this once.

## 1. Create the spreadsheet + script

1. Create a new Google Sheet (this becomes the guest list).
2. In the Sheet: **Extensions → Apps Script**. This makes a *container-bound*
   script (so `SpreadsheetApp.getActiveSpreadsheet()` works).
3. Delete the starter code, paste the contents of [`Code.gs`](./Code.gs), Save.

The `RSVP` tab (with headers) is created automatically on the first submission.

## 2. Create the Telegram bot + find the chat id

1. In Telegram, message **@BotFather** → `/newbot` → follow prompts → copy the
   **bot token**.
2. Decide where notifications go:
   - **Personal DM:** open your bot and press **Start** (a bot can't message you
     until you do). Your chat id = your user id.
   - **Group "свадьба":** create the group, add the bot to it. Group ids are
     negative (e.g. `-1001234567890`).
3. Find the chat id: send any message to the bot / group, then open
   `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and read
   `result[].message.chat.id`. (Personal id also via **@userinfobot**.)

## 3. Store the secrets

In the Apps Script editor: **Project Settings (gear) → Script Properties → Add**:

| Property         | Value                         |
| ---------------- | ----------------------------- |
| `TELEGRAM_TOKEN` | the bot token from BotFather  |
| `TELEGRAM_CHAT`  | the chat id from step 2       |

## 4. Deploy as a Web App

1. **Deploy → New deployment → type: Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Authorize when prompted. Copy the **Web app URL** (ends in `/exec`).
4. Test: open the `/exec` URL — it should return `{"ok":true,...}` (that's
   `doGet`). Submitting the real form appends a row and pings Telegram.

> Every time you change `Code.gs`, redeploy: **Deploy → Manage deployments →
> edit (pencil) → Version: New version → Deploy**. Otherwise the old code runs.

## 5. Point the site at the URL

Set `VITE_RSVP_ENDPOINT` to the `/exec` URL:

- **Production (GitHub Pages):** repo **Settings → Secrets and variables →
  Actions → Variables → New variable** named `VITE_RSVP_ENDPOINT`. The deploy
  workflow reads it at build time. Re-run the workflow to pick it up.
- **Local dev:** create `.env.local` with `VITE_RSVP_ENDPOINT=<the /exec URL>`
  (see `.env.example`). Leaving it unset keeps the form local-only (it just
  shows the thank-you screen and sends nothing).

## Notes

- The URL is not a secret (the token stays in Script Properties), but anyone who
  finds it could POST junk. A honeypot field on the form blocks naive bots; for
  a wedding the risk is low. Add server-side checks if it ever becomes a problem.
- The client sends a `no-cors` request (Apps Script doesn't send CORS headers),
  so the browser can't read the response — the form shows success optimistically
  and only reports an error on network failure. The Telegram message / new sheet
  row is your real confirmation that it arrived.
