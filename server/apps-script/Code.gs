/**
 * RSVP backend for the Гордей & Елизавета wedding invite.
 *
 * Deployed as a container-bound Google Apps Script Web App (created from the
 * Google Sheet via Extensions → Apps Script). On each submission it appends a
 * row to the "RSVP" sheet and sends a Telegram notification. The bot token
 * stays here, server-side — never in the client bundle.
 *
 * Required Script Properties (Project Settings → Script Properties):
 *   TELEGRAM_TOKEN — bot token from @BotFather
 *   TELEGRAM_CHAT  — chat id to notify (personal id, or a group id like -100…)
 *
 * Setup details: see README.md in this folder.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    recordRow(data);
    notifyTelegram(data);
    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

// Simple health check when the /exec URL is opened in a browser.
function doGet() {
  return jsonOutput({ ok: true, service: "wedding-rsvp" });
}

function recordRow(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("RSVP");
  if (!sheet) {
    sheet = ss.insertSheet("RSVP");
    sheet.appendRow(["Время", "Имя", "Придёт", "Куда", "Спутники", "Напитки"]);
  }
  sheet.appendRow([
    new Date(),
    data.name || "",
    data.coming || "",
    data.where || "",
    (data.companions || []).join(", "),
    data.drinks || "",
  ]);
}

function notifyTelegram(data) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty("TELEGRAM_TOKEN");
  var chat = props.getProperty("TELEGRAM_CHAT");
  if (!token || !chat) return; // not configured — skip silently

  // The client sends coming as "Придёт" / "Не придёт".
  var isComing = String(data.coming || "").indexOf("Не") !== 0;
  var name = (data.name || "—").trim();

  var lines = [
    "💌 <b>Новый ответ!</b>",
    "",
    "от <b>" + esc(name) + "</b>",
    (isComing ? "🥳" : "😔") + " " + esc(data.coming || "—"),
  ];

  var details = [];
  if (data.where) details.push("📍 Куда: " + esc(data.where));
  if (data.companions && data.companions.length) {
    details.push("👥 Спутники: " + esc(data.companions.join(", ")));
  }
  if (data.drinks) details.push("🍷 Напитки: " + esc(data.drinks));
  if (details.length) {
    lines.push("");
    lines = lines.concat(details);
  }

  UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      chat_id: chat,
      text: lines.join("\n"),
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
}

// Escape user-supplied text for Telegram's HTML parse mode.
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
