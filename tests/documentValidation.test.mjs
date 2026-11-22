import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProductDocumentFile } from "../src/documentValidation.ts";

test("accepts PDFs within the size limit, including uppercase extensions", () => {
  assert.doesNotThrow(() => validateProductDocumentFile({
    name: "license.PDF", type: "application/pdf", size: 10 * 1024 * 1024,
  }));
});

test("rejects mismatched type, extension and invalid sizes", () => {
  const valid = { name: "document.pdf", type: "application/pdf", size: 1 };
  for (const file of [
    { ...valid, type: "text/html" },
    { ...valid, name: "document.html" },
    { ...valid, size: 0 },
    { ...valid, size: 10 * 1024 * 1024 + 1 },
  ]) {
    assert.throws(() => validateProductDocumentFile(file));
  }
});
