import { supabase } from "./supabase";

export const IMAGE_BUCKET = "product-images";
export const SIGNED_IMAGE_URL_TTL_SECONDS = 600;

export function getManagedImagePathFromUrl(value: string | undefined): string | undefined {
  if (!supabase || !value) return undefined;
  try {
    const imageUrl = new URL(value);
    const projectUrl = new URL(import.meta.env.VITE_SUPABASE_URL);
    if (imageUrl.origin !== projectUrl.origin) return undefined;
    const match = imageUrl.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign|authenticated)\/product-images\/(.+)$/,
    );
    if (!match?.[1]) return undefined;
    const path = decodeURIComponent(match[1]);
    if (!path || path.split("/").some((part) => part === "." || part === "..")) {
      return undefined;
    }
    return path;
  } catch {
    return undefined;
  }
}

const allowedImageExtensions: Record<string, Set<string>> = {
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
};
const canonicalExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const allowedFolders = new Set(["products", "categories", "homepage", "site"]);
const maxImageSize = 5 * 1024 * 1024;

export async function uploadManagedImage(
  file: File,
  folder: "products" | "categories" | "homepage" | "site",
): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowedImageExtensions[file.type]?.has(extension)) {
    throw new Error("Only JPEG, PNG and WebP images are allowed.");
  }
  if (file.size <= 0 || file.size > maxImageSize) {
    throw new Error("Image size must be greater than zero and 5 MB or less.");
  }
  if (!allowedFolders.has(folder)) {
    throw new Error("Unsupported image destination.");
  }

  const path = `${folder}/${crypto.randomUUID()}.${canonicalExtensions[file.type]}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;
  return path;
}

export async function createManagedImageUrl(path: string): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(path, SIGNED_IMAGE_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteManagedImage(path: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);
  if (error) throw error;
}
