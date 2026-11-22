import { test } from "node:test";
import assert from "node:assert/strict";
import { uploadProductImageBatch } from "../src/productImageBatch.ts";
import { deleteDocumentSafely, DocumentDeletionError } from "../src/documentDeletion.ts";

test("uploads images in sequence and makes only the first image primary", async () => {
  const events = [];
  const attached = [];
  const count = await uploadProductImageBatch(
    [{ name: "one.jpg" }, { name: "two.jpg" }], 0, "alt",
    {
      upload: async (file) => { events.push(`upload ${file.name}`); return file.name; },
      attach: async (image) => { events.push(`attach ${image.storagePath}`); return image.storagePath; },
      cleanup: async () => assert.fail("unexpected cleanup"),
      onAttached: (image) => attached.push(image),
    },
  );
  assert.equal(count, 2);
  assert.deepEqual(events, ["upload one.jpg", "attach one.jpg", "upload two.jpg", "attach two.jpg"]);
  assert.deepEqual(attached.map(({ sortOrder, isPrimary }) => [sortOrder, isPrimary]), [[0, true], [1, false]]);
});

test("stops a batch after an attach failure and reports cleanup failures and completed uploads", async () => {
  const attached = [];
  const events = [];
  await assert.rejects(uploadProductImageBatch(
    [{ name: "one.jpg" }, { name: "bad.jpg" }, { name: "later.jpg" }], 2, "",
    {
      upload: async (file) => { events.push(file.name); return file.name; },
      attach: async (image) => {
        if (image.storagePath === "bad.jpg") throw new Error("attach failed");
        return "id";
      },
      cleanup: async () => { throw new Error("cleanup failed"); },
      onAttached: (image) => attached.push(image),
    },
  ), /bad\.jpg.*1 successful.*attach failed.*cleanup failed.*Remaining files/s);
  assert.deepEqual(events, ["one.jpg", "bad.jpg"]);
  assert.equal(attached[0].sortOrder, 2);
  assert.equal(attached[0].isPrimary, false);
});

test("unpublishes before removing a document file and record", async () => {
  const events = [];
  await deleteDocumentSafely({
    unpublish: async () => { events.push("unpublish"); },
    removeFile: async () => { events.push("file"); },
    removeRecord: async () => { events.push("record"); },
  });
  assert.deepEqual(events, ["unpublish", "file", "record"]);
});

test("does not remove a file if unpublish fails, and reports later failures as unpublished", async () => {
  const events = [];
  await assert.rejects(deleteDocumentSafely({
    unpublish: async () => { throw new Error("denied"); },
    removeFile: async () => { events.push("file"); },
    removeRecord: async () => { events.push("record"); },
  }), (error) => error instanceof DocumentDeletionError && !error.unpublished);
  assert.deepEqual(events, []);
  await assert.rejects(deleteDocumentSafely({
    unpublish: async () => {},
    removeFile: async () => {},
    removeRecord: async () => { throw new Error("record failure"); },
  }), (error) => error instanceof DocumentDeletionError && error.unpublished && /record failure/.test(error.message));
});
