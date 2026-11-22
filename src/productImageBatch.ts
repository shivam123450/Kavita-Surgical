import type { ProductImage } from "./products";

type BatchOperations = {
  upload: (file: File) => Promise<string>;
  attach: (image: ProductImage) => Promise<string>;
  cleanup: (path: string) => Promise<void>;
  onAttached: (image: ProductImage) => void;
};

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "Unknown error.";
}

export async function uploadProductImageBatch(
  files: File[],
  existingCount: number,
  altText: string,
  operations: BatchOperations,
): Promise<number> {
  let uploaded = 0;
  for (const file of files) {
    let path: string | undefined;
    let imageId: string;
    const image: ProductImage = {
      altText,
      sortOrder: existingCount + uploaded,
      isPrimary: existingCount + uploaded === 0,
      published: false,
    };
    try {
      path = await operations.upload(file);
      image.storagePath = path;
      imageId = await operations.attach(image);
    } catch (error) {
      let cleanupError = "";
      if (path) {
        try {
          await operations.cleanup(path);
        } catch (caught) {
          cleanupError = ` Cleanup failed for ${path}: ${message(caught)}`;
        }
      }
      const failure = new Error(`Unable to attach "${file.name}" after ${uploaded} successful upload(s): ${message(error)}.${cleanupError} Remaining files were not uploaded.`);
      Object.defineProperty(failure, "cause", { value: error });
      throw failure;
    }
    operations.onAttached({ ...image, id: imageId });
    uploaded++;
  }
  return uploaded;
}
