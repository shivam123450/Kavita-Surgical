import { business } from "./business";
import type { Product } from "./products";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export interface ProductPricing {
  originalPrice?: number;
  offerPrice?: number;
  sellingPrice?: number;
  discountPercentage?: number;
}

function isValidPrice(price: number | undefined): price is number {
  return typeof price === "number" && Number.isFinite(price) && price > 0;
}

export function formatPrice(price: number): string {
  return inrFormatter.format(price);
}

export function getProductPricing(product: Product): ProductPricing {
  const originalPrice = isValidPrice(product.originalPrice) ? product.originalPrice : undefined;
  const requestedOfferPrice = isValidPrice(product.offerPrice) ? product.offerPrice : undefined;

  if (originalPrice !== undefined && requestedOfferPrice !== undefined && requestedOfferPrice < originalPrice) {
    const discountPercentage = Math.round(((originalPrice - requestedOfferPrice) / originalPrice) * 100);

    return {
      originalPrice,
      offerPrice: requestedOfferPrice,
      sellingPrice: requestedOfferPrice,
      discountPercentage,
    };
  }

  return {
    sellingPrice: originalPrice ?? requestedOfferPrice,
  };
}

export function createProductEnquiryMessage(product: Product): string {
  const pricing = getProductPricing(product);
  const details = [
    `Product: ${product.name}`,
    `Original Price (MRP): ${pricing.originalPrice === undefined ? "Please confirm" : formatPrice(pricing.originalPrice)}`,
    `Offer Price: ${pricing.sellingPrice === undefined ? "Please confirm" : formatPrice(pricing.sellingPrice)}`,
  ];

  if (
    pricing.discountPercentage !== undefined &&
    pricing.discountPercentage > 0 &&
    pricing.originalPrice !== undefined &&
    pricing.offerPrice !== undefined
  ) {
    details.push(`Discount: ${pricing.discountPercentage}%`);
  }

  details.push(
    "",
    product.gstRate === undefined
      ? "GST details to be confirmed. Please confirm final pricing."
      : `GST: ${product.gstRate}%. Please confirm final pricing.`,
  );

  return [
    `Hello ${business.name},`,
    "",
    "I am interested in the following product:",
    "",
    ...details,
    "",
    "Please share more details regarding this product.",
  ].join("\n");
}
