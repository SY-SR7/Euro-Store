const fs = require('fs');

const arPath = 'apps/web/src/i18n/messages/ar.json';
const enPath = 'apps/web/src/i18n/messages/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!ar.productDetails) ar.productDetails = {};
if (!en.productDetails) en.productDetails = {};

const arDetails = {
  loading: "جاري التحميل...",
  notFoundTitle: "المنتج غير موجود",
  notFoundImage: "صورة المنتج غير موجود",
  backToProducts: "عودة للمنتجات",
  home: "الرئيسية",
  products: "المنتجات",
  productImage: "صورة المنتج",
  image: "صورة",
  variant: "متغير",
  totalStock: "المخزون الكلي",
  selectedVariant: "المتغير المحدد",
  color: "اللون",
  colorLabel: "لون",
  size: "المقاس",
  sizeLabel: "مقاس",
  stock: "المخزون",
  pieces: "قطعة",
  extraDetails: "تفاصيل إضافية",
  noVariants: "لا توجد متغيرات متاحة حالياً",
  chooseVariant: "اختر المتغير المناسب",
  outOfStockShort: "نفذ",
  outOfStockLong: "نفذ المخزون",
  lowStock: "كمية قليلة",
  available: "متوفر",
  addedToCart: "✓ تمت الإضافة إلى السلة",
  addToCart: "أضف إلى السلة",
  chooseVariantFirst: "اختر المتغير أولاً",
  category: "التصنيف:"
};

const enDetails = {
  loading: "Loading...",
  notFoundTitle: "Product Not Found",
  notFoundImage: "Product image not found",
  backToProducts: "Back to Products",
  home: "Home",
  products: "Products",
  productImage: "Product Image",
  image: "Image",
  variant: "Variant",
  totalStock: "Total Stock",
  selectedVariant: "Selected Variant",
  color: "Color",
  colorLabel: "Color",
  size: "Size",
  sizeLabel: "Size",
  stock: "Stock",
  pieces: "pcs",
  extraDetails: "Additional Details",
  noVariants: "No variants available currently",
  chooseVariant: "Choose a suitable variant",
  outOfStockShort: "Out",
  outOfStockLong: "Out of Stock",
  lowStock: "Low Stock",
  available: "Available",
  addedToCart: "✓ Added to Cart",
  addToCart: "Add to Cart",
  chooseVariantFirst: "Choose variant first",
  category: "Category:"
};

Object.assign(ar.productDetails, arDetails);
Object.assign(en.productDetails, enDetails);

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log("productDetails translation updated");
