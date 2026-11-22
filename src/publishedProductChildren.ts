function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object")
    : [];
}

function matchesLegacyImage(value: unknown, image: Record<string, unknown>): boolean {
  if (typeof value !== "string" || !value) return false;
  if (image.url === value) return true;
  if (typeof image.storage_path !== "string" || !image.storage_path) return false;
  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/product-images\/(.+)$/);
    return Boolean(match && decodeURIComponent(match[1]) === image.storage_path);
  } catch {
    return false;
  }
}

export function filterPublishedProductChildren(row: Record<string, unknown>): Record<string, unknown> {
  const images = records(row.product_images);
  const hiddenLegacyImage = images.some((image) =>
    image.is_published !== true && matchesLegacyImage(row.image, image));
  return {
    ...row,
    image: hiddenLegacyImage ? null : row.image,
    product_images: images.filter((image) => image.is_published === true),
    product_documents: records(row.product_documents).filter((document) => document.is_published === true),
  };
}
