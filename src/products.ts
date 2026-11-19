export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  filterCategory: "Handles & Shafts" | "Dissectors" | "Scissors" | "Graspers";
  description: string;
  image: string;
  imageAlt: string;
  originalPrice?: number;
  offerPrice?: number;
  featured?: boolean;
}

export const products: Product[] = [
  {
    id: "laparoscopic-instrument",
    sku: "KS / LH-01",
    name: "5mm Laparoscopic Modular Handle & Shaft",
    category: "Laparoscopic Instruments",
    filterCategory: "Handles & Shafts",
    description:
      "Reusable 5mm x 330mm insulated shaft with 360° rotatable pistol-grip handle and monopolar cautery port.",
    image: "/products/laparoscopic-instrument.webp",
    imageAlt: "Long-shaft laparoscopic instrument with a black hand-operated handle.",
    featured: true,
  },
  {
    id: "curved-instrument-tip",
    sku: "KS / MS-02",
    name: "5mm Curved Metzenbaum Scissors",
    category: "Instrument Tips",
    filterCategory: "Scissors",
    description:
      "Double-action curved surgical stainless steel blades for precise tissue dissection and suture cutting.",
    image: "/products/curved-instrument-tip.webp",
    imageAlt: "Curved metal instrument tip attached to a long dark shaft.",
    featured: true,
  },
  {
    id: "open-jaw-instrument",
    sku: "KS / MD-03",
    name: "5mm Maryland Dissector",
    category: "Instrument Tips",
    filterCategory: "Dissectors",
    description:
      "Tapered curved jaws with fine horizontal serrations for blunt tissue dissection and delicate grasping.",
    image: "/products/open-jaw-instrument.webp",
    imageAlt: "Open metal instrument jaws at the end of a long dark shaft.",
    featured: true,
  },
  {
    id: "serrated-jaw-instrument",
    sku: "KS / FG-04",
    name: "5mm Fenestrated Atraumatic Grasper",
    category: "Instrument Tips",
    filterCategory: "Graspers",
    description:
      "Slotted elongated jaws with atraumatic serrations for secure, non-crushing bowel and organ handling.",
    image: "/products/serrated-jaw-instrument.webp",
    imageAlt: "Open metal instrument jaws with visible serrations.",
  },
];

export const categories = [...new Set(products.map((product) => product.category))];
