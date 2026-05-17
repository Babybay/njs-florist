"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ensureCartSessionId, readCartSessionId } from "@/lib/cart-session";
import {
  addToCart,
  loadCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/server/services/cart.service";

export async function loadActiveCartAction() {
  const sessionId = await readCartSessionId();
  if (!sessionId) return null;
  return loadCart({ sessionId });
}

export async function addToCartFormAction(formData: FormData) {
  const sessionId = await ensureCartSessionId();
  const productId = String(formData.get("productId") ?? "");
  const variantId = String(formData.get("variantId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const cardMessage = String(formData.get("cardMessage") ?? "").trim() || undefined;
  const addonsRaw = formData.getAll("addonId").map((v) => String(v)).filter(Boolean);
  const addons = addonsRaw.map((addonId) => ({ addonId, quantity: 1 }));

  await addToCart({ sessionId, productId, variantId, quantity, addons, cardMessage });
  revalidatePath("/cart");
  redirect("/cart");
}

export async function removeCartItemAction(formData: FormData) {
  const sessionId = await readCartSessionId();
  if (!sessionId) return;
  const itemId = String(formData.get("itemId") ?? "");
  const cartId = String(formData.get("cartId") ?? "");
  if (!itemId || !cartId) return;
  await removeCartItem(itemId, cartId);
  revalidatePath("/cart");
}

export async function updateCartItemQuantityAction(formData: FormData) {
  const sessionId = await readCartSessionId();
  if (!sessionId) return;
  const itemId = String(formData.get("itemId") ?? "");
  const cartId = String(formData.get("cartId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  if (!itemId || !cartId) return;
  await updateCartItemQuantity(itemId, cartId, quantity);
  revalidatePath("/cart");
}
