import { env } from "@/lib/env";

export type WhatsAppMessage = {
  to: string;
  body: string;
};

function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

async function sendViaFonnte(msg: WhatsAppMessage) {
  if (!env.WHATSAPP_API_TOKEN) {
    console.warn("[whatsapp] WHATSAPP_API_TOKEN not set; skipping send.");
    return null;
  }
  const target = normalizePhone(msg.to);
  if (!target) {
    console.warn("[whatsapp] Invalid phone:", msg.to);
    return null;
  }
  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: env.WHATSAPP_API_TOKEN,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ target, message: msg.body }).toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fonnte error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function sendWhatsApp(msg: WhatsAppMessage) {
  if (env.WHATSAPP_PROVIDER === "none") {
    console.info("[whatsapp:dry-run]", msg);
    return null;
  }
  if (env.WHATSAPP_PROVIDER === "fonnte") {
    return sendViaFonnte(msg);
  }
  return null;
}

export async function sendWhatsAppToAdmin(body: string) {
  if (!env.WHATSAPP_ADMIN_NUMBER) return null;
  return sendWhatsApp({ to: env.WHATSAPP_ADMIN_NUMBER, body });
}
