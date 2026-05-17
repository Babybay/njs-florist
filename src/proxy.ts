import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "on",
  // Loose CSP — allows inline styles (tailwind/JIT), Cloudinary images, Midtrans + Supabase.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.cloudinary.com https://api.sandbox.midtrans.com https://api.midtrans.com https://app.sandbox.midtrans.com https://app.midtrans.com",
    "frame-src https://app.sandbox.midtrans.com https://app.midtrans.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ].join("; "),
};

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all routes except:
     * - Static files and Next internals
     * - The Midtrans webhook and cron API endpoints (server-to-server)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/payments/midtrans/webhook|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
