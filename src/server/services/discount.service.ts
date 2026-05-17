import { z } from "zod";
import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

type DiscountClient = PrismaClient | Prisma.TransactionClient;

export type ResolvedDiscount = {
  id: string;
  code: string;
  amount: number;
};

export async function resolveDiscountCode(
  code: string | undefined,
  subtotal: number,
  client: DiscountClient = db,
): Promise<ResolvedDiscount | null> {
  if (!code) return null;

  const discount = await client.discountCode.findUnique({ where: { code } });
  if (!discount || !discount.isActive) return null;

  const now = new Date();
  if (discount.startsAt && discount.startsAt > now) return null;
  if (discount.endsAt && discount.endsAt < now) return null;
  if (discount.maxUses != null && discount.usedCount >= discount.maxUses) return null;
  if (discount.minSpend != null && subtotal < discount.minSpend) return null;

  const amount =
    discount.type === "PERCENT"
      ? Math.floor((subtotal * discount.value) / 100)
      : Math.min(discount.value, subtotal);

  if (amount <= 0) return null;

  return { id: discount.id, code: discount.code, amount };
}

export async function incrementDiscountUsage(discountId: string, client: DiscountClient = db) {
  return client.discountCode.update({
    where: { id: discountId },
    data: { usedCount: { increment: 1 } },
  });
}

export const discountCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((s) => s.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().min(1).max(10_000_000),
  minSpend: z.coerce.number().int().min(0).nullish(),
  maxUses: z.coerce.number().int().min(1).nullish(),
  startsAt: z.coerce.date().nullish(),
  endsAt: z.coerce.date().nullish(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const discountUpdateSchema = discountCreateSchema.partial().extend({
  id: z.string().min(1),
});

export async function createDiscountCode(input: unknown) {
  const parsed = discountCreateSchema.parse(input);
  return db.discountCode.create({
    data: {
      code: parsed.code,
      type: parsed.type,
      value: parsed.value,
      minSpend: parsed.minSpend ?? null,
      maxUses: parsed.maxUses ?? null,
      startsAt: parsed.startsAt ?? null,
      endsAt: parsed.endsAt ?? null,
      isActive: parsed.isActive ?? true,
    },
  });
}

export async function updateDiscountCode(input: unknown) {
  const parsed = discountUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  return db.discountCode.update({ where: { id }, data: rest });
}

export async function setDiscountActive(id: string, isActive: boolean) {
  return db.discountCode.update({ where: { id }, data: { isActive } });
}

export async function listDiscountCodes() {
  return db.discountCode.findMany({ orderBy: { code: "asc" } });
}
