export function validateProductDocumentFile(file: Pick<File, "name" | "type" | "size">): void {
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files are allowed.");
  }
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
    throw new Error("PDF size must be greater than zero and 10 MB or less.");
  }
}
