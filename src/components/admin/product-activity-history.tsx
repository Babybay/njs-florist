import { CardSection, EmptyState, tagClass } from "@/components/admin/ui";
import { formatDateTime, formatIDR } from "@/lib/money";
import type { listProductActivity } from "@/server/services/activity-log.service";

type ProductActivity = Awaited<ReturnType<typeof listProductActivity>>[number];

const ACTION_LABELS: Record<string, string> = {
  "product.created": "Produk dibuat",
  "product.updated": "Detail produk diedit",
  "product.archived": "Produk diarsipkan",
  "product.image_added": "Gambar ditambahkan",
  "product.image_removed": "Gambar dihapus",
  "product.addon_attached": "Add-on dipasang",
  "product.addon_detached": "Add-on dilepas",
  "product.variant_created": "Varian dibuat",
  "product.variant_archived": "Varian diarsipkan",
  "product.variant_activated": "Varian diaktifkan",
  "product.recipe_updated": "Recipe diubah",
  "product.recipe_removed": "Recipe dihapus",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nama",
  slug: "Slug",
  description: "Deskripsi",
  basePrice: "Harga dasar",
  categoryId: "Kategori",
  status: "Status",
  isSameDayEligible: "Same-day eligible",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function actorLabel(log: ProductActivity) {
  const meta = asRecord(log.metadata);
  const metaActor = asRecord(meta.actor);
  return (
    log.actor?.name ||
    log.actor?.email ||
    (typeof metaActor.name === "string" ? metaActor.name : "") ||
    (typeof metaActor.email === "string" ? metaActor.email : "") ||
    "Admin tidak dikenal"
  );
}

function actorSubLabel(log: ProductActivity) {
  const meta = asRecord(log.metadata);
  const metaActor = asRecord(meta.actor);
  const email = log.actor?.email || (typeof metaActor.email === "string" ? metaActor.email : "");
  const role = log.actor?.role || (typeof metaActor.role === "string" ? metaActor.role : "");
  return [email, role].filter(Boolean).join(" - ");
}

function formatValue(field: string, value: unknown) {
  if (value == null || value === "") return "-";
  if (field === "basePrice" && typeof value === "number") return formatIDR(value);
  if (field === "isSameDayEligible") return value ? "Ya" : "Tidak";
  return String(value);
}

function changeLines(log: ProductActivity) {
  const meta = asRecord(log.metadata);
  const changes = Array.isArray(meta.changes) ? meta.changes : [];

  return changes
    .map((item) => asRecord(item))
    .filter((item) => typeof item.field === "string")
    .map((item) => {
      const field = String(item.field);
      return {
        field,
        label: FIELD_LABELS[field] ?? field,
        before: formatValue(field, item.before),
        after: formatValue(field, item.after),
      };
    });
}

function detailLine(log: ProductActivity) {
  const meta = asRecord(log.metadata);

  if (typeof meta.addonName === "string") return meta.addonName;
  if (typeof meta.variantName === "string") return `${meta.variantName}${meta.sku ? ` (${meta.sku})` : ""}`;
  if (typeof meta.inventoryItemName === "string") {
    return `${meta.inventoryItemName}${meta.quantityNeeded ? ` x ${meta.quantityNeeded}` : ""}`;
  }
  if (typeof meta.url === "string") return meta.url;

  const product = asRecord(meta.product);
  if (typeof product.name === "string") return product.name;

  return "";
}

export function ProductActivityHistory({ logs }: { logs: ProductActivity[] }) {
  return (
    <CardSection title="Riwayat edit" description="Audit trail admin untuk perubahan produk ini.">
      {logs.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat"
          description="Perubahan baru setelah fitur ini aktif akan tercatat di sini."
        />
      ) : (
        <ol className="relative grid gap-3 before:absolute before:bottom-0 before:left-[7px] before:top-1 before:w-px before:bg-stone-200">
          {logs.map((log) => {
            const changes = changeLines(log);
            const detail = detailLine(log);

            return (
              <li key={log.id} className="relative pl-7">
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-stone-400 shadow-sm" />
                <article className="rounded-md border border-stone-200 bg-stone-50/50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-stone-900">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </p>
                        <span className={tagClass(log.action === "product.created" ? "emerald" : "neutral")}>
                          {actorLabel(log)}
                        </span>
                      </div>
                      {actorSubLabel(log) ? (
                        <p className="mt-0.5 text-xs text-stone-500">{actorSubLabel(log)}</p>
                      ) : null}
                    </div>
                    <time className="text-xs text-stone-500">{formatDateTime(log.createdAt)}</time>
                  </div>

                  {detail ? <p className="mt-2 break-all text-xs text-stone-600">{detail}</p> : null}

                  {changes.length > 0 ? (
                    <ul className="mt-2 grid gap-1.5">
                      {changes.map((change) => (
                        <li key={change.field} className="rounded bg-white px-2 py-1.5 text-xs text-stone-700">
                          <span className="font-semibold text-stone-900">{change.label}</span>
                          <span className="text-stone-500">: {change.before} -&gt; </span>
                          <span>{change.after}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </CardSection>
  );
}
