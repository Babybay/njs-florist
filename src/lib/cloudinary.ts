import crypto from "node:crypto";
import { env } from "@/lib/env";

export function createCloudinarySignature(params: Record<string, string | number>) {
  const apiSecret = env.CLOUDINARY_API_SECRET ?? "";
  const payload = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}
