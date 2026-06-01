import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Role } from "@/types/order";

export type ActivityActor = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export type ActivityMetadata = Prisma.JsonObject & {
  actor?: {
    email: string;
    name: string | null;
    role: Role;
  };
};

export async function logActivity(input: {
  actor: ActivityActor;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.JsonObject;
}) {
  const metadata: ActivityMetadata = {
    ...(input.metadata ?? {}),
    actor: {
      email: input.actor.email,
      name: input.actor.name,
      role: input.actor.role,
    },
  };

  return db.activityLog.create({
    data: {
      actorId: input.actor.id,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata,
    },
  });
}

export async function listProductActivity(productId: string) {
  const logs = await db.activityLog.findMany({
    where: {
      entity: "product",
      entityId: productId,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const actorIds = Array.from(new Set(logs.map((log) => log.actorId).filter(Boolean))) as string[];
  const actors = actorIds.length
    ? await db.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true, name: true, role: true },
      })
    : [];
  const actorById = new Map(actors.map((actor) => [actor.id, actor]));

  return logs.map((log) => ({
    ...log,
    actor: log.actorId ? actorById.get(log.actorId) ?? null : null,
  }));
}
