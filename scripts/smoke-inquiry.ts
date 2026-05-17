import { PrismaClient } from "@prisma/client";
import { createInquiry, updateInquiryStatus } from "../src/server/services/inquiry.service";

const db = new PrismaClient();

async function main() {
  const inquiry = await createInquiry({
    customerName: "Smoke Tester",
    customerEmail: `smoke-${Date.now()}@example.com`,
    customerPhone: "081234567890",
    occasion: "wedding",
    budget: 1500000,
    preferredDate: new Date(Date.now() + 86_400_000 * 14),
    notes: "Bunga putih + eucalyptus untuk dekor villa pantai.",
    referenceUrls: ["https://example.com/ref1.jpg"],
  });

  const updated = await updateInquiryStatus(inquiry.id, "QUOTED", "Quote IDR 1.350.000, kirim H-1");

  const persisted = await db.customInquiry.findUnique({ where: { id: inquiry.id } });

  console.log(
    JSON.stringify(
      {
        created: { id: inquiry.id, status: inquiry.status },
        updated: { status: updated.status, adminNote: updated.adminNote },
        persistedStatus: persisted?.status,
        referenceUrls: persisted?.referenceUrls,
      },
      null,
      2,
    ),
  );

  // Cleanup.
  await db.customInquiry.delete({ where: { id: inquiry.id } });
}

main()
  .catch((e) => {
    console.error("ERR", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
