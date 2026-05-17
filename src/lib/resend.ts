import { Resend } from "resend";
import { env } from "@/lib/env";

const client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const fromAddress = env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  if (!client) {
    console.log(`[email:stub] to=${input.to} subject=${input.subject}`);
    return { id: `dev-email-${Date.now()}`, ...input };
  }
  const result = await client.emails.send({
    from: fromAddress,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }
  return { id: result.data?.id ?? "", ...input };
}
