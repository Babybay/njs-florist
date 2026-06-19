// One-off: send a sample "ready for pickup" email via Resend to verify delivery.
// Reads RESEND_API_KEY / RESEND_FROM_EMAIL from .env.local (no secrets hardcoded).
// Usage: node scripts/test-pickup-email.mjs [recipient@example.com]
import { readFileSync } from "node:fs";

function readEnv(file, key) {
  try {
    const txt = readFileSync(file, "utf8");
    const m = txt.match(new RegExp(`^${key}="?([^"\\n\\r]*)"?`, "m"));
    return m ? m[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

const KEY = readEnv(".env.local", "RESEND_API_KEY");
const FROM = readEnv(".env.local", "RESEND_FROM_EMAIL") || "onboarding@resend.dev";
const TO = process.argv[2] || "satriab2108@gmail.com";

if (!KEY) {
  console.error("No RESEND_API_KEY found in .env.local");
  process.exit(1);
}

const html = `
<div style="max-width:560px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
  <div style="background:#9f1239;color:#fff;padding:24px 28px;border-radius:12px 12px 0 0">
    <p style="margin:0;font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.85">njs Florist</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:600">Pesananmu siap diambil 🌸</h1>
  </div>
  <div style="border:1px solid #e7e5e4;border-top:0;border-radius:0 0 12px 12px;padding:28px">
    <p style="margin:0 0 16px">Halo <strong>Satria</strong>, rangkaianmu sudah selesai dan menunggu di studio kami.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:6px 0;color:#78716c">Nomor pesanan</td><td style="padding:6px 0;text-align:right;font-weight:600">BLM-20260619-0001</td></tr>
      <tr><td style="padding:6px 0;color:#78716c">Jadwal pickup</td><td style="padding:6px 0;text-align:right;font-weight:600">19 Jun 2026 · 14.00–16.00 WITA</td></tr>
      <tr><td style="padding:6px 0;color:#78716c">Lokasi</td><td style="padding:6px 0;text-align:right;font-weight:600">Jl. Sunset Road No. 88, Kuta</td></tr>
      <tr><td style="padding:6px 0;color:#78716c">Atas nama</td><td style="padding:6px 0;text-align:right;font-weight:600">Satria · +62 812-0000-0000</td></tr>
    </table>
    <div style="margin:20px 0;padding:14px 16px;background:#fdf2f8;border-radius:8px;font-size:13px;line-height:1.6">
      Tunjukkan <strong>nomor pesanan</strong> ini ke staf saat tiba. Bunga segar paling cantik diambil sesuai jadwal ya.
    </div>
    <p style="margin:0;color:#78716c;font-size:12px">Ini adalah email uji coba dari sistem notifikasi njs Florist.</p>
  </div>
</div>`;

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from: FROM,
    to: TO,
    subject: "Pesananmu siap diambil - BLM-20260619-0001",
    html,
  }),
});

console.log("from:", FROM, "→ to:", TO);
console.log("HTTP", res.status);
console.log(await res.text());
