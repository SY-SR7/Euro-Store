export type CatalogListProduct = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  minPrice: number;
  raw_min_price?: number;
  maxPrice?: number;
  discount_percentage?: number | null;
  created_at: string;
  total_stock: number;
  image_url: string;
  default_variant_id: string | null;
  default_variant_stock: number;
  has_multiple_variants: boolean;
};

export type CatalogFilterOption = {
  id: string;
  slug: string;
  name_ar?: string;
  name_en?: string;
  name?: string;
  value_ar?: string;
  value_en?: string;
  hex_color?: string | null;
  count: number;
  selected?: boolean;
};

export type CatalogAttributeFilter = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  values: CatalogFilterOption[];
};

export type CatalogFilters = {
  categories: CatalogFilterOption[];
  brands: CatalogFilterOption[];
  attributes: CatalogAttributeFilter[];
  priceRange?: { min: number; max: number };
};

export type CatalogResponse = {
  data: CatalogListProduct[];
  total: number;
  page: number;
  per_page: number;
  filters: CatalogFilters;
};

export type ProductAttributeValue = {
  id: string;
  value_ar: string;
  value_en: string;
  hex_color?: string | null;
  attribute_types: { id: string; name_ar: string; name_en: string; slug: string };
};

export type ProductVariant = {
  id: string;
  sku: string;
  price_syp: number;
  compare_price_syp?: number | null;
  stock_quantity: number;
  is_active: boolean;
  variant_attributes: Array<{ attribute_values: ProductAttributeValue }>;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  created_at: string;
  discount_percentage?: number | null;
  is_on_sale: boolean;
  brands?: { name: string } | null;
  product_images: Array<{ id: string; url: string; alt_ar?: string | null; alt_en?: string | null }>;
  product_videos: Array<{ id: string; url: string; thumbnail_url?: string | null }>;
  product_variants: ProductVariant[];
};

export type SizeGuide = { id: string; name: string; content: unknown } | null;

export type ProductBundle = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string | null;
  description_en?: string | null;
  bundle_price: number;
  bundle_items: Array<{
    id: string;
    quantity: number;
    product_variant: {
      id: string;
      stock_quantity: number;
      products: { id: string; name_ar: string; name_en: string; product_images: Array<{ url: string; is_primary: boolean }> };
    };
  }>;
};

export type ProductDetailResponse = {
  product: ProductDetail;
  size_guide: SizeGuide;
  bundles: ProductBundle[];
};

export type ReviewResponse = {
  average: number;
  count: number;
  reviews: Array<{ id: string; rating: number; comment?: string | null; created_at: string; customer_name: string }>;
};
