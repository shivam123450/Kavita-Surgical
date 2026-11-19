import { supabase } from "./supabase";
import type { Product } from "./products";

export interface AdminProduct extends Product {
  databaseId?: string;
  sortOrder: number;
  published: boolean;
  featured: boolean;
}

export function mapDatabaseProduct(row: Record<string, unknown>): AdminProduct {
  return {
    databaseId: String(row.id),
    id: String(row.id),
    sku: String(row.sku ?? ""),
    name: String(row.name ?? ""),
    category: String(row.category ?? ""),
    filterCategory: (row.filter_category as AdminProduct["filterCategory"]) ?? "Handles & Shafts",
    description: String(row.description ?? ""),
    image: String(row.image ?? ""),
    imageAlt: String(row.image_alt ?? ""),
    originalPrice:
      row.original_price === null || row.original_price === undefined
        ? undefined
        : Number(row.original_price),
    offerPrice:
      row.offer_price === null || row.offer_price === undefined
        ? undefined
        : Number(row.offer_price),
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function fetchPublishedProducts(): Promise<AdminProduct[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapDatabaseProduct);
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapDatabaseProduct);
}

export async function saveAdminProduct(product: AdminProduct): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const payload = {
    sku: product.sku,
    name: product.name,
    category: product.category,
    filter_category: product.filterCategory,
    description: product.description,
    image: product.image,
    image_alt: product.imageAlt,
    original_price: product.originalPrice ?? null,
    offer_price: product.offerPrice ?? null,
    featured: product.featured,
    published: product.published,
    sort_order: product.sortOrder,
  };

  if (product.databaseId) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", product.databaseId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("products").insert(payload);
    if (error) throw error;
  }
}

export async function deleteAdminProduct(product: AdminProduct): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!product.databaseId) return;
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", product.databaseId);
  if (error) throw error;
}
