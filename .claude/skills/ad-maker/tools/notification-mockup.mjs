#!/usr/bin/env node
/**
 * notification-mockup.mjs — OS-accurate notification/popup mockups (iPhone lock-screen
 * banner, Android heads-up notification, old-Windows XP-style balloon toast) as full
 * 1080x1920 HTML frames, rendered locally through card.mjs (headless Chrome, no model
 * spend). Backs the "notification / popup" format (references/formats/notification-popup.md).
 *
 * House defaults locked in 2026-09-14 (Austin, bathroom-remodel notification run):
 *   - Plain solid black or white background — no simulated wallpaper/desktop art.
 *     Keeps the card itself as the only thing competing for attention.
 *   - The notification card is vertically centered in the frame (flex-centered), not
 *     pinned to a "realistic" lock-screen position. This is a deliberate departure from
 *     OS accuracy in favor of the ad reading clearly at a glance.
 *   - Every text element is >=16px (CSS px at the nominal 1080-wide frame, before the
 *     2x retina `scale`), and that floor holds NO MATTER HOW TALL the card gets — the
 *     frame is `min-height`, not a fixed `height`, so a long body copy grows the card
 *     downward instead of shrinking its type to fit a fixed box. Never add auto-shrink /
 *     "fit text to box" logic here; extend the canvas instead. Pass a larger `maxHeight`
 *     (see `SAFE_MAX_H`) when a variant's body copy is unusually long.
 *   - Audience is explicitly senior-friendly mobile readers: body copy defaults to
 *     36-45px (bumped 50% again on 2026-09-14 — not just the 16px legal floor),
 *     headings 45px+, generous line-height
 *     (>=1.3), and high contrast (white/near-white text on solid black, or near-black on
 *     solid white — never gray-on-gray for anything a reader must read to act).
 *
 * Usage (CLI):
 *   node notification-mockup.mjs spec.json
 *   spec.json: { "outDir": "...", "scale": 2, "items": [
 *     { "name": "01", "os": "iphone"|"android"|"winxp", "bg": "black"|"white", ...fields }
 *   ] }
 *   Fields per os — see iphoneNotification / androidNotification / winxpNotification below.
 *
 * Usage (import):
 *   import { iphoneNotification, androidNotification, winxpNotification } from "./notification-mockup.mjs";
 *   const html = iphoneNotification({ title, body, cta });  // full 1080x1920 HTML string
 */
import { writeFile, mkdtemp } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

export const W = 1080, H = 1920;
export const MIN_FONT = 16;
// Safety ceiling for card.mjs's `maxHeight` (its screenshot viewport height). The frame
// itself only ever grows to fit content (min-height), never shrinks text — this is just
// how tall a variant is *allowed* to grow before the render gets clipped. Pass a bigger
// value than this only if a single variant's body copy is exceptionally long.
export const SAFE_MAX_H = 2600;

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// `min-height` + a flex COLUMN of normal-flow children (never position:absolute for the
// main stack): a card with more text than the nominal frame grows the frame downward and
// stays centered, rather than clipping or shrinking its type. Absolutely-positioned
// children do NOT contribute to a parent's height, which is exactly the bug this avoids —
// every builder below stacks statusBar / clock / centering-wrapper / taskbar as real flex
// children so overflow pushes the frame taller instead of being clipped or hidden.
const frame = (inner, bg) => `
<div style="width:${W}px;min-height:${H}px;display:flex;flex-direction:column;background:${bg};font-family:-apple-system,'SF Pro Text','Helvetica Neue','Segoe UI',Roboto,Arial,sans-serif;box-sizing:border-box;">
${inner}
</div>`;

/* ---------- iPhone lock-screen banner ---------- */
export function iphoneNotification({
  title, body, cta, appName = "HomeAlerts", time = "9:41", date = "Sunday, September 14",
  bg = "black", offsetY = 0,
}) {
  const dark = bg !== "white";
  const ink = dark ? "#ffffff" : "#0d0d0d";
  const statusBar = `
  <div style="flex:0 0 auto;height:76px;display:flex;align-items:center;justify-content:space-between;padding:0 46px;color:${ink};font-size:45px;font-weight:600;box-sizing:border-box;">
    <div>${time}</div>
    <div style="display:flex;gap:10px;align-items:center;">
      <svg width="34" height="22" viewBox="0 0 34 22"><rect x="0" y="14" width="5" height="8" rx="1" fill="${ink}"/><rect x="8" y="10" width="5" height="12" rx="1" fill="${ink}"/><rect x="16" y="6" width="5" height="16" rx="1" fill="${ink}"/><rect x="24" y="0" width="5" height="22" rx="1" fill="${ink}"/></svg>
      <svg width="34" height="22" viewBox="0 0 34 22"><path d="M2 9c8-8 22-8 30 0l-3 3c-6-6-18-6-24 0z" fill="${ink}"/><path d="M8 14c4-4 12-4 16 0l-3 3c-2-2-6-2-8 0z" fill="${ink}"/><circle cx="17" cy="19" r="2.5" fill="${ink}"/></svg>
      <svg width="46" height="22" viewBox="0 0 46 22"><rect x="1" y="1" width="38" height="20" rx="5" stroke="${ink}" stroke-width="2" fill="none"/><rect x="4" y="4" width="30" height="14" rx="2.5" fill="${ink}"/><rect x="41" y="7" width="3" height="8" rx="1.5" fill="${ink}"/></svg>
    </div>
  </div>`;
  const clock = `
  <div style="flex:0 0 auto;margin-top:74px;text-align:center;color:${ink};opacity:.9;">
    <div style="font-size:168px;font-weight:600;line-height:1;letter-spacing:-2px;">${time}</div>
    <div style="font-size:48px;font-weight:500;margin-top:6px;">${esc(date)}</div>
  </div>`;
  const cardBg = dark ? "rgba(246,246,248,0.94)" : "rgba(255,255,255,0.98)";
  const card = `
  <div style="flex:1 1 auto;display:flex;align-items:center;justify-content:center;padding:40px 0;">
    <div style="width:${W - 120}px;transform:translateY(${offsetY}px);background:${cardBg};border-radius:26px;padding:26px 28px 24px;box-shadow:0 14px 34px rgba(0,0,0,.45);box-sizing:border-box;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:10px;">
        <div style="width:44px;height:44px;border-radius:11px;background:linear-gradient(160deg,#5b7bff,#2c46b8);display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 12l8-7 8 7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 11v8h12v-8" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>
        </div>
        <div style="font-size:42px;font-weight:600;color:#1c1c1e;flex:1;">${esc(appName)}</div>
        <div style="font-size:36px;color:#6b6b70;">now</div>
      </div>
      <div style="font-size:54px;font-weight:700;color:#1c1c1e;line-height:1.3;margin-bottom:10px;">${esc(title)}</div>
      <div style="font-size:45px;color:#2e2e30;line-height:1.4;">${esc(body)}</div>
      <div style="height:1px;background:#d8d8db;margin:20px 0 16px;"></div>
      <div style="text-align:center;font-size:48px;font-weight:800;letter-spacing:.5px;color:#cc0000;text-transform:uppercase;">${esc(cta)}</div>
    </div>
  </div>`;
  return frame(statusBar + clock + card, dark ? "#000000" : "#ffffff");
}

/* ---------- Android heads-up notification ---------- */
export function androidNotification({
  title, body, ctaPrimary, ctaSecondary = "DISMISS", appName = "Home Alerts", time = "9:41",
  bg = "black", offsetY = 0,
}) {
  const dark = bg !== "white";
  const ink = dark ? "#ffffff" : "#0d0d0d";
  const statusBar = `
  <div style="flex:0 0 auto;height:66px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;color:${ink};font-size:39px;font-weight:500;box-sizing:border-box;">
    <div>${time}</div>
    <div style="display:flex;gap:14px;align-items:center;">
      <svg width="26" height="26" viewBox="0 0 24 24"><path d="M1 9l2 2c5-5 13-5 18 0l2-2C16 2 8 2 1 9z" fill="${ink}"/><path d="M5 13l2 2c3-3 7-3 10 0l2-2c-4-4-10-4-14 0z" fill="${ink}"/><circle cx="12" cy="18" r="2" fill="${ink}"/></svg>
      <svg width="30" height="18" viewBox="0 0 30 18"><rect x="1" y="1" width="24" height="16" rx="3" stroke="${ink}" stroke-width="2" fill="none"/><rect x="26" y="6" width="3" height="6" fill="${ink}"/></svg>
    </div>
  </div>`;
  const cardBg = dark ? "#20262b" : "#f4f5f6";
  const cardInk = dark ? "#ffffff" : "#0d0d0d";
  const cardSub = dark ? "#d3d8da" : "#3c4043";
  const card = `
  <div style="flex:1 1 auto;display:flex;align-items:center;justify-content:center;padding:40px 0;">
    <div style="width:${W - 68}px;transform:translateY(${offsetY}px);background:${cardBg};border-radius:18px;padding:30px 32px;box-shadow:0 16px 30px rgba(0,0,0,.45);box-sizing:border-box;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
        <div style="width:46px;height:46px;border-radius:50%;background:#3ddc97;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 12l8-7 8 7" stroke="#0a2f24" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 11v8h12v-8" stroke="#0a2f24" stroke-width="2.2" fill="none" stroke-linejoin="round"/></svg>
        </div>
        <div style="font-size:39px;color:${dark ? "#c9d1d3" : "#5f6368"};flex:1;">${esc(appName)}</div>
        <div style="font-size:36px;color:${dark ? "#8b9497" : "#80868b"};">now</div>
      </div>
      <div style="font-size:54px;font-weight:700;color:${cardInk};line-height:1.32;margin-bottom:12px;">${esc(title)}</div>
      <div style="font-size:45px;color:${cardSub};line-height:1.42;margin-bottom:26px;">${esc(body)}</div>
      <div style="display:flex;justify-content:flex-end;gap:36px;">
        <div style="font-size:42px;font-weight:700;letter-spacing:.5px;color:${dark ? "#9aa4a7" : "#5f6368"};">${esc(ctaSecondary)}</div>
        <div style="font-size:42px;font-weight:700;letter-spacing:.5px;color:${dark ? "#7fe8c0" : "#0a8a5c"};">${esc(ctaPrimary)}</div>
      </div>
    </div>
  </div>`;
  return frame(statusBar + card, dark ? "#000000" : "#ffffff");
}

/* ---------- Old Windows (XP-style) balloon toast ---------- */
export function winxpNotification({ heading, body, cta, bg = "black", offsetY = 0 }) {
  const dark = bg !== "white";
  const deskInk = dark ? "#ffffff" : "#0d0d0d";
  const taskbar = `
  <div style="flex:0 0 auto;height:64px;background:linear-gradient(180deg,#2c60d1,#1948b5);display:flex;align-items:center;box-shadow:0 -3px 6px rgba(0,0,0,.3);">
    <div style="height:64px;width:120px;background:linear-gradient(180deg,#6fce3e,#2f9e14);display:flex;align-items:center;justify-content:center;font-size:39px;font-weight:800;color:#fff;font-style:italic;box-shadow:2px 0 6px rgba(0,0,0,.25);">Start</div>
    <div style="flex:1;height:64px;background:linear-gradient(180deg,#3a6fe0,#2354c2);"></div>
    <div style="height:64px;background:#1948b5;display:flex;align-items:center;gap:18px;padding:0 24px;color:#fff;font-size:36px;">
      <svg width="24" height="24" viewBox="0 0 24 24"><rect x="2" y="14" width="4" height="8" fill="#fff"/><rect x="8" y="9" width="4" height="13" fill="#fff"/><rect x="14" y="4" width="4" height="18" fill="#fff"/></svg>
      <svg width="24" height="24" viewBox="0 0 24 24"><rect x="1" y="6" width="18" height="12" rx="2" stroke="#fff" stroke-width="2" fill="none"/><rect x="21" y="9" width="2" height="6" fill="#fff"/></svg>
      <div>4:47 PM</div>
    </div>
  </div>`;
  const balloon = `
  <div style="flex:1 1 auto;display:flex;align-items:center;justify-content:center;padding:40px 0;">
    <div style="width:${W - 200}px;transform:translateY(${offsetY}px);position:relative;">
      <div style="background:#fffde8;border:1px solid #6b8fc9;border-radius:6px;box-shadow:0 10px 26px rgba(0,0,0,.5);overflow:hidden;">
        <div style="background:linear-gradient(180deg,#ffd75e,#ffb400);display:flex;align-items:center;padding:14px 18px;">
          <div style="width:28px;height:28px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#c98a00;margin-right:14px;flex:0 0 auto;">i</div>
          <div style="flex:1;font-size:39px;font-weight:700;color:#4a3200;">Windows Notification</div>
          <div style="width:24px;height:24px;text-align:center;line-height:24px;font-size:30px;color:#4a3200;">x</div>
        </div>
        <div style="padding:24px 26px 28px;">
          <div style="font-size:48px;font-weight:700;color:#111;line-height:1.34;margin-bottom:14px;">${esc(heading)}</div>
          <div style="font-size:42px;color:#333;line-height:1.46;margin-bottom:22px;">${esc(body)}</div>
          <div style="font-size:42px;font-weight:700;color:#1a4fd6;text-decoration:underline;">${esc(cta)}</div>
        </div>
      </div>
      <svg style="position:absolute;bottom:-16px;right:70px;" width="40" height="20" viewBox="0 0 40 20"><path d="M0 0 L40 0 L20 20 Z" fill="#fffde8" stroke="#6b8fc9" stroke-width="1"/></svg>
    </div>
  </div>`;
  return frame(balloon + taskbar, dark ? "#000000" : "#ffffff");
}

export const BUILDERS = { iphone: iphoneNotification, android: androidNotification, winxp: winxpNotification };

/* ---------- CLI: spec.json -> cards.json -> card.mjs ---------- */
async function main() {
  const specPath = process.argv[2];
  if (!specPath) { console.error("usage: node notification-mockup.mjs <spec.json>"); process.exit(1); }
  const spec = JSON.parse(await (await import("node:fs/promises")).readFile(specPath, "utf8"));
  const cards = (spec.items ?? []).map((item) => {
    const build = BUILDERS[item.os];
    if (!build) throw new Error(`unknown os "${item.os}" (iphone | android | winxp)`);
    return { name: item.name, kind: "html", width: W, maxHeight: item.maxHeight ?? SAFE_MAX_H, html: build(item) };
  });
  const tmp = await mkdtemp(join(tmpdir(), "notif-"));
  const cardsJsonPath = join(tmp, "cards.json");
  await writeFile(cardsJsonPath, JSON.stringify({ outDir: spec.outDir, scale: spec.scale ?? 2, cards }, null, 2));
  const cardMjs = join(dirname(fileURLToPath(import.meta.url)), "card.mjs");
  await new Promise((res, rej) => {
    const p = spawn(process.execPath, [cardMjs, cardsJsonPath], { stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? res() : rej(new Error(`card.mjs exited ${code}`))));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
