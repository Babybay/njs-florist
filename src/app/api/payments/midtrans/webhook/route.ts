import { handleMidtransWebhook } from "@/server/services/payment.service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await handleMidtransWebhook(payload);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 400 },
    );
  }
}
