import Image from "next/image";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { CloudinaryUpload } from "@/components/admin/cloudinary-upload";
import { ProductActivityHistory } from "@/components/admin/product-activity-history";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { VariantCreateForm } from "@/components/admin/variant-create-form";
import { formatIDR } from "@/lib/money";
import { db } from "@/lib/db";
import { listProductActivity } from "@/server/services/activity-log.service";
import { getProductAdminView } from "@/server/services/product.service";
import { listCategories, listInventoryItems } from "@/server/services/catalog.service";
import {
  archiveProductAction,
  attachAddonAction,
  detachAddonAction,
  removeProductImageAction,
} from "@/server/actions/product.actions";
import {
  activateVariantAction,
  addVariantRecipeAction,
  archiveVariantAction,
  removeVariantRecipeAction,
} from "@/server/actions/variant.actions";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, inventoryItems, allAddons, activityLogs] = await Promise.all([
    getProductAdminView(id),
    listCategories(),
    listInventoryItems(),
    db.addon.findMany({ orderBy: { name: "asc" } }),
    listProductActivity(id),
  ]);
  if (!product) notFound();

  const attachedAddonIds = new Set(product.addons.map((a) => a.addonId));

  return (
    <>
      <AdminPageHeader
        title={`Edit ${product.name}`}
        description="Kelola detail katalog, gambar, varian + recipe, dan add-on yang terhubung."
      />

      <div className="grid gap-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-950">Detail produk</h2>
          <ProductEditForm
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              description: product.description,
              basePrice: product.basePrice,
              categoryId: product.categoryId,
              status: product.status,
              isSameDayEligible: product.isSameDayEligible,
            }}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
          <form action={archiveProductAction} className="mt-3">
            <input type="hidden" name="id" value={product.id} />
            <button
              type="submit"
              className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
            >
              Arsipkan produk
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-950">Gambar</h2>
          <div className="grid gap-3">
            {product.images.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600">
                Belum ada gambar.
              </p>
            ) : (
              product.images.map((image) => (
                <div
                  key={image.id}
                  className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="relative h-20 w-28 overflow-hidden rounded-md bg-stone-100">
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 text-sm text-stone-600">
                    <p className="break-all text-stone-700">{image.url}</p>
                    {image.altText ? <p className="mt-1 text-xs text-stone-500">{image.altText}</p> : null}
                  </div>
                  <form action={removeProductImageAction}>
                    <input type="hidden" name="id" value={image.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <button
                      type="submit"
                      className="rounded-full px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Hapus
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <CloudinaryUpload productId={product.id} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-950">Varian & recipe</h2>
          <div className="grid gap-4">
            {product.variants.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600">
                Belum ada varian. Tambahkan di bawah.
              </p>
            ) : (
              product.variants.map((variant) => (
                <article key={variant.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-stone-950">
                        {variant.name}{" "}
                        <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
                          {variant.isActive ? "ACTIVE" : "ARCHIVED"}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        SKU {variant.sku} · {formatIDR(product.basePrice + variant.priceAdjust)}
                      </p>
                    </div>
                    <form action={variant.isActive ? archiveVariantAction : activateVariantAction}>
                      <input type="hidden" name="id" value={variant.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-rose-300"
                      >
                        {variant.isActive ? "Arsipkan" : "Aktifkan"}
                      </button>
                    </form>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Recipe</p>
                    <ul className="mt-2 grid gap-2">
                      {variant.recipes.length === 0 ? (
                        <li className="rounded-md bg-stone-50 px-3 py-2 text-xs text-stone-600">
                          Belum ada recipe — varian ini akan dianggap stok 0.
                        </li>
                      ) : (
                        variant.recipes.map((recipe) => (
                          <li
                            key={recipe.id}
                            className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-2 text-sm"
                          >
                            <span className="text-stone-800">
                              {recipe.inventoryItem.name} × {recipe.quantityNeeded}{" "}
                              <span className="text-stone-500">{recipe.inventoryItem.unit}</span>
                            </span>
                            <form action={removeVariantRecipeAction}>
                              <input type="hidden" name="id" value={recipe.id} />
                              <input type="hidden" name="productId" value={product.id} />
                              <button
                                type="submit"
                                className="text-xs font-semibold text-rose-700 hover:underline"
                              >
                                Hapus
                              </button>
                            </form>
                          </li>
                        ))
                      )}
                    </ul>
                    <form
                      action={addVariantRecipeAction}
                      className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]"
                    >
                      <input type="hidden" name="variantId" value={variant.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <select
                        name="inventoryItemId"
                        required
                        className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
                      >
                        <option value="">Pilih bahan</option>
                        {inventoryItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        name="quantityNeeded"
                        type="number"
                        min={1}
                        defaultValue={1}
                        required
                        className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-rose-500"
                      />
                      <button
                        type="submit"
                        className="rounded-full bg-rose-900 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800"
                      >
                        + Recipe
                      </button>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mt-6">
            <VariantCreateForm
              productId={product.id}
              inventoryOptions={inventoryItems.map((item) => ({
                id: item.id,
                name: item.name,
                unit: item.unit,
              }))}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-950">Add-on</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {allAddons.map((addon) => {
              const attached = attachedAddonIds.has(addon.id);
              const action = attached ? detachAddonAction : attachAddonAction;
              return (
                <form
                  key={addon.id}
                  action={action}
                  className="flex items-center justify-between gap-3 rounded-md border border-stone-200 bg-white p-3 text-sm shadow-sm"
                >
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="addonId" value={addon.id} />
                  <span>
                    <span className="font-semibold text-stone-950">{addon.name}</span>
                    <span className="ml-2 text-stone-500">{formatIDR(addon.price)}</span>
                  </span>
                  <button
                    type="submit"
                    className={
                      attached
                        ? "rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-rose-300"
                        : "rounded-full bg-rose-900 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-800"
                    }
                  >
                    {attached ? "Lepas" : "Pasang"}
                  </button>
                </form>
              );
            })}
          </div>
        </section>

        <ProductActivityHistory logs={activityLogs} />
      </div>
    </>
  );
}
