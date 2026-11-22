import { supabase } from "./supabase";
import { validateProductDocumentFile } from "./documentValidation";

export const DOCUMENT_BUCKET = "product-documents";
export const SIGNED_DOCUMENT_URL_TTL_SECONDS = 600;

export async function uploadProductDocumentFile(productId: string, file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");
  validateProductDocumentFile(file);
  const path = `${productId}/${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function createProductDocumentUrl(path: string): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.storage.from(DOCUMENT_BUCKET)
    .createSignedUrl(path, SIGNED_DOCUMENT_URL_TTL_SECONDS, { download: true });
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteProductDocumentFile(path: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
  if (error) throw error;
}
