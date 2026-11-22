export interface BuyerDetails {
  buyerName: string;
  organisation: string;
  phone: string;
  location: string;
  notes: string;
}

export interface QuoteMessageItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price?: string;
  gstRate?: number;
}

export function createQuoteMessage(
  businessName: string,
  pageUrl: string,
  items: QuoteMessageItem[],
  buyer: BuyerDetails,
): string {
  const productBase = new URL(pageUrl);
  productBase.search = "";
  productBase.hash = "";
  return [
    `Hello ${businessName},`, "", "I would like to enquire about:", "",
    ...items.map((item, index) => {
      const link = new URL(`#product/${encodeURIComponent(item.id)}`, productBase).href;
      return `${index + 1}. ${item.name || "Unavailable product"} | SKU: ${item.sku || "Not provided"} | Product ID: ${item.id} | Quantity: ${item.quantity}\n${link}${item.price === undefined ? "" : `\nIndicative unit price: ${item.price}`}${item.gstRate === undefined ? "" : `\nGST: ${item.gstRate}%`}`;
    }),
    "", ...(buyer.buyerName.trim() ? [`Name: ${buyer.buyerName.trim()}`] : []),
    ...(buyer.organisation.trim() ? [`Organisation: ${buyer.organisation.trim()}`] : []),
    ...(buyer.phone.trim() ? [`Phone: ${buyer.phone.trim()}`] : []),
    ...(buyer.location.trim() ? [`Location: ${buyer.location.trim()}`] : []),
    ...(buyer.notes.trim() ? [`Notes: ${buyer.notes.trim()}`] : []),
    "", "Please confirm availability and final pricing.",
  ].join("\n");
}
