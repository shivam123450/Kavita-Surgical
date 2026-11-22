import { test } from "node:test";
import assert from "node:assert/strict";
import { filterPublishedProductChildren } from "../src/publishedProductChildren.ts";

test("filters draft children before primary image selection without changing input", () => {
  const row = {
    image: "https://example.test/hidden.jpg",
    product_images: [
      { url: "https://example.test/hidden.jpg", is_primary: true, is_published: false },
      { url: "https://example.test/live.jpg", is_primary: false, is_published: true },
    ],
    product_documents: [{ id: "draft", is_published: false }, { id: "live", is_published: true }],
  };
  const result = filterPublishedProductChildren(row);
  assert.equal(result.image, null);
  assert.deepEqual(result.product_images, [row.product_images[1]]);
  assert.deepEqual(result.product_documents, [row.product_documents[1]]);
  assert.equal(row.product_images.length, 2);
});

test("suppresses a legacy managed URL pointing to a draft image and retains unrelated fallback", () => {
  const row = {
    image: "https://example.test/storage/v1/object/public/product-images/products/draft.jpg",
    product_images: [{ storage_path: "products/draft.jpg", is_published: false }],
    product_documents: [],
  };
  assert.equal(filterPublishedProductChildren(row).image, null);
  assert.equal(filterPublishedProductChildren({ ...row, image: "https://example.test/legacy.jpg" }).image,
    "https://example.test/legacy.jpg");
});
