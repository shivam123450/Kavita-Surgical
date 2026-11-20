import { supabase } from "./supabase";
import type { Product } from "./products";
import type { ProductImage, ProductSpecification } from "./products";

export interface AdminProduct extends Product {
  databaseId?: string;
  sortOrder: number;
  published: boolean;
  featured: boolean;
  featuredOrder: number;
  images: ProductImage[];
  specifications: ProductSpecification[];
}

export interface AdminCategory {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  imageStoragePath?: string;
  imageAlt: string;
  imagePublished: boolean;
  sortOrder: number;
  published: boolean;
}

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  published: boolean;
}

export type FilterCategoryDraft = Omit<FilterCategory, "id"> & { id?: string };

export interface HomepageSettings {
  id: "homepage";
  heroTitle: string;
  heroSubtitle: string;
  heroImageStoragePath: string;
  heroImageUrl: string;
  heroImageAlt: string;
  heroImagePublished: boolean;
  featuredProductLimit: number;
  featuredProductIds: string[];
}

export interface SiteImage {
  id?: string;
  sectionKey: "about-visual" | "promotional-banner" | "site-icon";
  storagePath: string;
  altText: string;
  sortOrder: number;
  published: boolean;
}

export interface BusinessSettings {
  id: "business";
  name: string;
  gstin: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  linkedin: string;
}

export function mapDatabaseProduct(row: Record<string, unknown>): AdminProduct {
  const images = Array.isArray(row.product_images)
    ? row.product_images
        .map((image) => image as Record<string, unknown>)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
        .map((image) => ({
          id: String(image.id),
          url: String(image.url ?? ""),
          storagePath: String(image.storage_path ?? "") || undefined,
          altText: String(image.alt_text ?? ""),
          sortOrder: Number(image.sort_order ?? 0),
          isPrimary: Boolean(image.is_primary),
          published: Boolean(image.is_published),
        }))
    : [];
  const specifications = Array.isArray(row.product_specifications)
    ? row.product_specifications
        .map((spec) => spec as Record<string, unknown>)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
        .map((spec) => ({
          id: String(spec.id),
          label: String(spec.label),
          value: String(spec.value),
          sortOrder: Number(spec.sort_order ?? 0),
        }))
    : [];
  const primaryImage = images.find((image) => image.isPrimary) ?? images[0];
  const categoryRow =
    row.categories && typeof row.categories === "object"
      ? (row.categories as Record<string, unknown>)
      : null;

  return {
    databaseId: String(row.id),
    id: String(row.id),
    sku: String(row.sku ?? ""),
    name: String(row.name ?? ""),
    categoryId: row.category_id ? String(row.category_id) : undefined,
    category: String(categoryRow?.name ?? row.category ?? ""),
    filterCategoryId: row.filter_category_id ? String(row.filter_category_id) : undefined,
    description: String(row.description ?? ""),
    imageStoragePath: primaryImage?.storagePath || undefined,
    imageUrl: String(primaryImage?.url || row.image || "") || undefined,
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
    featuredOrder: Number(row.featured_order ?? 0),
    gstRate:
      row.gst_rate === null || row.gst_rate === undefined
        ? undefined
        : Number(row.gst_rate),
    published: Boolean(row.published),
    sortOrder: Number(row.sort_order ?? 0),
    images,
    specifications,
  };
}

export async function fetchPublishedProducts(): Promise<AdminProduct[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*,categories(name),product_images(*),product_specifications(*)")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapDatabaseProduct);
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("products")
    .select("*,categories(name),product_images(*),product_specifications(*)")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapDatabaseProduct);
}

export async function saveAdminProduct(product: AdminProduct): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const payload = {
    sku: product.sku,
    name: product.name,
    category: product.category,
    category_id: product.categoryId ?? null,
    filter_category_id: product.filterCategoryId ?? null,
    description: product.description,
    image: product.imageUrl?.trim() || null,
    image_alt: product.imageAlt,
    original_price: product.originalPrice ?? null,
    offer_price: product.offerPrice ?? null,
    gst_rate: product.gstRate ?? null,
    featured: product.featured,
    featured_order: product.featuredOrder,
    published: product.published,
    sort_order: product.sortOrder,
  };

  if (product.databaseId) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", product.databaseId)
      .select("id")
      .single();
    if (error) throw error;
    await saveProductSpecifications(product.databaseId, product.specifications);
    return product.databaseId;
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    const productId = String(data.id);
    await saveProductSpecifications(productId, product.specifications);
    return productId;
  }
}

export async function deleteAdminProduct(product: AdminProduct): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!product.databaseId) return;
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", product.databaseId)
    .select("id")
    .single();
  if (error) throw error;
}

async function saveProductSpecifications(
  productId: string,
  specifications: ProductSpecification[],
) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error: deleteError } = await supabase
    .from("product_specifications")
    .delete()
    .eq("product_id", productId);
  if (deleteError) throw deleteError;
  if (specifications.length === 0) return;
  const rows = specifications
    .map((spec, index) => ({
      product_id: productId,
      label: spec.label.trim(),
      value: spec.value.trim(),
      sort_order: spec.sortOrder ?? index,
    }))
    .filter((spec) => spec.label && spec.value);
  if (rows.length > 0) {
    const { error } = await supabase.from("product_specifications").insert(rows);
    if (error) throw error;
  }
}

export async function fetchCategories(): Promise<AdminCategory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    image: String(row.image ?? ""),
    imageStoragePath: String(row.image_storage_path ?? "") || undefined,
    imageAlt: String(row.image_alt ?? ""),
    imagePublished: Boolean(row.image_published),
    sortOrder: Number(row.sort_order ?? 0),
    published: Boolean(row.published),
  }));
}

export async function fetchPublishedCategories(): Promise<AdminCategory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    image: String(row.image ?? ""),
    imageStoragePath: String(row.image_storage_path ?? "") || undefined,
    imageAlt: String(row.image_alt ?? ""),
    imagePublished: Boolean(row.image_published),
    sortOrder: Number(row.sort_order ?? 0),
    published: Boolean(row.published),
  }));
}

function mapFilterCategory(row: Record<string, unknown>): FilterCategory {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    published: Boolean(row.is_published),
  };
}

export async function fetchFilterCategories(): Promise<FilterCategory[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("filter_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapFilterCategory);
}

export async function fetchPublishedFilterCategories(): Promise<FilterCategory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("filter_categories")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapFilterCategory);
}

export async function saveFilterCategory(
  category: FilterCategoryDraft,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const name = category.name.trim();
  const slug = category.slug.trim().toLowerCase();
  if (!name) throw new Error("Filter category name is required.");
  if (!Number.isInteger(category.sortOrder) || category.sortOrder < 0) {
    throw new Error("Display order must be a non-negative whole number.");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug must contain lowercase letters, numbers, and single hyphens only.");
  }
  const payload = {
    name,
    slug,
    description: category.description.trim(),
    sort_order: category.sortOrder,
    is_published: category.published,
  };
  const query = category.id
    ? supabase.from("filter_categories").update(payload).eq("id", category.id)
    : supabase.from("filter_categories").insert(payload);
  const { error } = await query.select("id").single();
  if (error) throw error;
}

export async function deleteFilterCategory(category: FilterCategory): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("filter_category_id", category.id);
  if (countError) throw countError;
  if (count) {
    throw new Error(
      `Cannot delete "${category.name}" because it is assigned to ${count} product${count === 1 ? "" : "s"}. Reassign those products first.`,
    );
  }
  const { error } = await supabase
    .from("filter_categories")
    .delete()
    .eq("id", category.id);
  if (error) throw error;
}

export async function saveCategory(category: AdminCategory): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const name = category.name.trim();
  const { data: existingCategories, error: existingError } = await supabase
    .from("categories")
    .select("id,name");
  if (existingError) throw existingError;
  const normalizedName = name.toLocaleLowerCase();
  if (existingCategories?.some((existing) =>
    existing.id !== category.id &&
    String(existing.name).trim().toLocaleLowerCase() === normalizedName
  )) {
    throw new Error(`A category named "${name}" already exists.`);
  }
  const payload = {
    name,
    slug: category.slug.trim(),
    description: category.description.trim(),
    image: category.image.trim() || null,
    image_storage_path: category.imageStoragePath ?? null,
    image_alt: category.imageAlt,
    image_published: category.imagePublished,
    sort_order: category.sortOrder,
    published: category.published,
  };
  const query = category.id
    ? supabase.from("categories").update(payload).eq("id", category.id)
    : supabase.from("categories").insert(payload);
  const { error } = await query.select("id").single();
  if (error) throw error;
}

export async function deleteCategory(category: AdminCategory): Promise<void> {
  if (!supabase || !category.id) return;
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", category.id)
    .select("id")
    .single();
  if (error) throw error;
}

export async function fetchSiteImages(): Promise<SiteImage[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("site_images")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("section_key", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    sectionKey: row.section_key as SiteImage["sectionKey"],
    storagePath: String(row.storage_path),
    altText: String(row.alt_text ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    published: Boolean(row.is_published),
  }));
}

export async function fetchPublishedSiteImages(): Promise<SiteImage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("site_images")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("section_key", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    sectionKey: row.section_key as SiteImage["sectionKey"],
    storagePath: String(row.storage_path),
    altText: String(row.alt_text ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
    published: Boolean(row.is_published),
  }));
}

export async function saveSiteImage(image: SiteImage): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("site_images").upsert({
    section_key: image.sectionKey,
    storage_path: image.storagePath,
    alt_text: image.altText.trim(),
    sort_order: image.sortOrder,
    is_published: image.published,
  }, { onConflict: "section_key" });
  if (error) throw error;
}

export async function deleteSiteImage(image: SiteImage): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("site_images")
    .delete()
    .eq("section_key", image.sectionKey);
  if (error) throw error;
}

export async function saveProductImage(
  productId: string,
  image: ProductImage,
): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const payload = {
    product_id: productId,
    url: image.url ?? "",
    storage_path: image.storagePath ?? "",
    alt_text: image.altText ?? "",
    sort_order: image.sortOrder ?? 0,
    is_primary: Boolean(image.isPrimary),
    is_published: Boolean(image.published),
  };
  const { data, error } = await supabase
    .from("product_images")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return String(data.id);
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error: clearError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  if (clearError) throw clearError;
  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("product_id", productId)
    .eq("id", imageId);
  if (error) throw error;
}

export async function setProductImagePublished(
  productId: string,
  imageId: string,
  published: boolean,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("product_images")
    .update({ is_published: published })
    .eq("product_id", productId)
    .eq("id", imageId);
  if (error) throw error;
}

export async function deleteProductImage(image: ProductImage): Promise<void> {
  if (!supabase) return;
  if (image.id) {
    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("id", image.id);
    if (error) throw error;
  }
  if (image.storagePath) {
    const { error: storageError } = await supabase.storage
      .from("product-images")
      .remove([image.storagePath]);
    if (storageError) throw storageError;
  }
}

export async function fetchHomepageSettings(): Promise<HomepageSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("homepage_settings")
    .select("*")
    .eq("id", "homepage")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: "homepage",
    heroTitle: String(data.hero_title ?? ""),
    heroSubtitle: String(data.hero_subtitle ?? ""),
    heroImageStoragePath: String(data.hero_image_storage_path ?? ""),
    heroImageUrl: String(data.hero_image ?? ""),
    heroImageAlt: String(data.hero_image_alt ?? ""),
    heroImagePublished: Boolean(data.hero_image_published),
    featuredProductLimit: Number(data.featured_product_limit ?? 3),
    featuredProductIds: Array.isArray(data.featured_product_ids)
      ? data.featured_product_ids.map(String)
      : [],
  };
}

export async function saveHomepageSettings(
  settings: HomepageSettings,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("homepage_settings").upsert({
    id: "homepage",
    hero_title: settings.heroTitle,
    hero_subtitle: settings.heroSubtitle,
    hero_image: settings.heroImageUrl.trim() || null,
    hero_image_storage_path: settings.heroImageStoragePath || null,
    hero_image_alt: settings.heroImageAlt,
    hero_image_published: settings.heroImagePublished,
    featured_product_limit: settings.featuredProductLimit,
    featured_product_ids: settings.featuredProductIds,
  });
  if (error) throw error;
}

export async function saveFeaturedProductLimit(limit: number): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error("Featured product limit must be a non-negative whole number.");
  }
  const { error } = await supabase.from("homepage_settings").upsert({
    id: "homepage",
    featured_product_limit: limit,
  });
  if (error) throw error;
}

export async function fetchBusinessSettings(): Promise<BusinessSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("business_settings")
    .select("*")
    .eq("id", "business")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: "business",
    name: String(data.name ?? ""),
    gstin: String(data.gstin ?? ""),
    phone: String(data.phone ?? ""),
    whatsapp: String(data.whatsapp ?? ""),
    email: String(data.email ?? ""),
    address: String(data.address ?? ""),
    instagram: String(data.instagram ?? ""),
    facebook: String(data.facebook ?? ""),
    linkedin: String(data.linkedin ?? ""),
  };
}

export async function saveBusinessSettings(
  settings: BusinessSettings,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("business_settings").upsert({
    id: "business",
    name: settings.name,
    gstin: settings.gstin,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    instagram: settings.instagram,
    facebook: settings.facebook,
    linkedin: settings.linkedin,
  });
  if (error) throw error;
}
