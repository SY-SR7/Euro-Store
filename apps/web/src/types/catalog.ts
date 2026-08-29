export interface ProductBundleImage {
  url: string;
  is_primary: boolean | null;
  sort_order: number | null;
}

export interface ProductBundleProduct {
  id: string;
  name_ar: string;
  name_en: string;
  status: string | null;
  is_active: boolean | null;
  product_images: ProductBundleImage[];
}

export interface ProductBundleVariant {
  id: string;
  sku: string;
  stock_quantity: number | null;
  is_active: boolean | null;
  products: ProductBundleProduct | null;
}

export interface ProductBundleItem {
  id: string;
  quantity: number;
  product_variant: ProductBundleVariant | null;
}

export interface ProductBundleView {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  bundle_price: number;
  status: string | null;
  bundle_items: ProductBundleItem[];
}
