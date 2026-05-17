import { createCloudinarySignature } from "@/lib/cloudinary";
import { env } from "@/lib/env";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { requireAdmin } from "@/server/services/auth.service";

export async function POST(request: Request) {
  // Only admins should be able to sign uploads — protects against burning Cloudinary quota.
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(clientKey(request, "cloudinary-sign"), {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await request.json();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = String(body.folder ?? "products");
  const signature = createCloudinarySignature({ folder, timestamp });

  return Response.json({
    folder,
    timestamp,
    signature,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
  });
}
