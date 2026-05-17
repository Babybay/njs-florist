import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().min(1).optional(),
  MIDTRANS_SERVER_KEY: z.string().min(1).optional(),
  MIDTRANS_MERCHANT_ID: z.string().min(1).optional(),
  MIDTRANS_IS_PRODUCTION: z.enum(["true", "false"]).default("false"),
  WHATSAPP_PROVIDER: z.enum(["fonnte", "none"]).default("none"),
  WHATSAPP_API_TOKEN: z.string().min(1).optional(),
  WHATSAPP_ADMIN_NUMBER: z.string().min(1).optional(),
  LOW_STOCK_ALERT_EMAIL: z.string().min(1).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  CALENDAR_FEED_SECRET: z.string().min(8).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
  MIDTRANS_MERCHANT_ID: process.env.MIDTRANS_MERCHANT_ID,
  MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION,
  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER,
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
  WHATSAPP_ADMIN_NUMBER: process.env.WHATSAPP_ADMIN_NUMBER,
  LOW_STOCK_ALERT_EMAIL: process.env.LOW_STOCK_ALERT_EMAIL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  CALENDAR_FEED_SECRET: process.env.CALENDAR_FEED_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

const isServer = typeof window === "undefined";

const merged = isServer ? serverSchema.merge(clientSchema) : clientSchema;

// Treat empty-string env vars as undefined so `optional()` works for blank placeholders.
const cleanedEnv: Record<string, string | undefined> = {};
for (const [key, value] of Object.entries(processEnv)) {
  cleanedEnv[key] = value === "" ? undefined : value;
}

const parsed = merged.safeParse(cleanedEnv);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data as z.infer<typeof serverSchema> & z.infer<typeof clientSchema>;
