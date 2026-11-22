export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId?: string;
  category: string;
  filterCategoryId?: string;
  description: string;
  imageStoragePath?: string;
  imageUrl?: string;
  imageAlt: string;
  originalPrice?: number;
  offerPrice?: number;
  gstRate?: number;
  featured?: boolean;
  featuredOrder?: number;
  published?: boolean;
  images?: ProductImage[];
  specifications?: ProductSpecification[];
  documents?: ProductDocument[];
}

export interface ProductDocument {
  id: string;
  title: string;
  kind: "document" | "license";
  storagePath: string;
  published: boolean;
}

export interface ProductImage {
  id?: string;
  url?: string;
  storagePath?: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  published?: boolean;
}

export interface ProductSpecification {
  id?: string;
  label: string;
  value: string;
  sortOrder?: number;
}
