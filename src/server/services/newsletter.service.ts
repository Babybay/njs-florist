import { db } from "@/lib/db";

/**
 * Record a newsletter signup. Idempotent: re-subscribing with the same email
 * is a no-op (upsert on the unique email), so the form never errors on repeats.
 */
export async function subscribeToNewsletter(email: string, source = "footer") {
  const normalized = email.trim().toLowerCase();
  return db.newsletterSubscriber.upsert({
    where: { email: normalized },
    update: {},
    create: { email: normalized, source },
  });
}
