export class DocumentDeletionError extends Error {
  readonly unpublished: boolean;

  constructor(message: string, unpublished: boolean, cause: unknown) {
    super(message);
    this.name = "DocumentDeletionError";
    this.unpublished = unpublished;
    Object.defineProperty(this, "cause", { value: cause });
  }
}

type DeletionOperations = {
  unpublish: () => Promise<void>;
  removeFile: () => Promise<void>;
  removeRecord: () => Promise<void>;
};

export async function deleteDocumentSafely(operations: DeletionOperations): Promise<void> {
  let unpublished = false;
  try {
    await operations.unpublish();
    unpublished = true;
    await operations.removeFile();
    await operations.removeRecord();
  } catch (error) {
    const detail = error instanceof Error ? error.message
      : error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message : "Unknown error.";
    throw new DocumentDeletionError(
      unpublished
        ? `Document was unpublished, but deletion did not finish: ${detail}. Check its record and Storage file before retrying.`
        : `Could not unpublish document; no file deletion was attempted: ${detail}`,
      unpublished,
      error,
    );
  }
}
