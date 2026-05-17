/**
 * Promote a user to a given role in the public.User table.
 * Usage: npx tsx scripts/promote-user.ts <email> <role>
 * Roles: SUPER_ADMIN | ADMIN | FLORIST_STAFF | DELIVERY_STAFF | CUSTOMER
 *
 * The user row is created on first login via getCurrentUser(), so the easiest
 * flow is: sign up → log in once → run this script with your email.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "FLORIST_STAFF", "DELIVERY_STAFF", "CUSTOMER"] as const;
type Role = (typeof VALID_ROLES)[number];

async function main() {
  const [rawEmail, rawRole] = process.argv.slice(2);
  if (!rawEmail || !rawRole) {
    console.error("Usage: npx tsx scripts/promote-user.ts <email> <role>");
    process.exit(1);
  }
  const email = rawEmail.toLowerCase();
  const role = rawRole.toUpperCase() as Role;
  if (!VALID_ROLES.includes(role)) {
    console.error(`Invalid role. Valid: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const user = await db.user.upsert({
    where: { email },
    update: { role },
    create: { email, role },
  });
  console.log(JSON.stringify({ id: user.id, email: user.email, role: user.role }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
