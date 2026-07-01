const fs = require('fs');

const arPath = 'apps/web/src/i18n/messages/ar.json';
const enPath = 'apps/web/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

// Cart
if (!ar.cart) ar.cart = {};
if (!en.cart) en.cart = {};

const cartAr = {
  emptyCart: "السلة فارغة",
  addProducts: "أضف بعض المنتجات المميزة إلى سلتك",
  browseProducts: "تصفح المنتجات",
  continueShopping: "متابعة التسوق",
  shoppingCart: "سلة التسوق",
  remove: "حذف",
  orderSummary: "ملخص الطلب",
  itemsCount: "عدد القطع",
  total: "الإجمالي",
  checkout: "إتمام الطلب",
  contactConfirmMsg: "سيتم التواصل معك هاتفياً لتأكيد الطلب"
};

const cartEn = {
  emptyCart: "Your cart is empty",
  addProducts: "Add some featured products to your cart",
  browseProducts: "Browse Products",
  continueShopping: "Continue Shopping",
  shoppingCart: "Shopping Cart",
  remove: "Remove",
  orderSummary: "Order Summary",
  itemsCount: "Items Count",
  total: "Total",
  checkout: "Checkout",
  contactConfirmMsg: "You will be contacted by phone to confirm your order"
};

Object.assign(ar.cart, cartAr);
Object.assign(en.cart, cartEn);

// Catalog (FilterableProductGrid)
if (!ar.catalog) ar.catalog = {};
if (!en.catalog) en.catalog = {};

const catalogAr = {
  syp: "ل.س",
  filters: "الفلاتر",
  clearAll: "مسح الكل",
  searchPlaceholder: "ابحث...",
  featuredOnly: "المنتجات المميزة",
  categories: "التصنيفات",
  brands: "العلامات التجارية",
  priceRange: "نطاق السعر",
  from: "من",
  to: "إلى",
  clearPrice: "مسح السعر",
  hideFilters: "إخفاء الفلاتر",
  showFilters: "إظهار الفلاتر",
  categoryCount: "تصنيف",
  brandCount: "ماركة",
  attrCount: "خاصية",
  loading: "جارٍ التحميل...",
  productCount: "منتج",
  noProducts: "لا توجد منتجات تطابق الفلاتر المحددة",
  clearAllFilters: "مسح جميع الفلاتر"
};

const catalogEn = {
  syp: "SYP",
  filters: "Filters",
  clearAll: "Clear All",
  searchPlaceholder: "Search...",
  featuredOnly: "Featured Only",
  categories: "Categories",
  brands: "Brands",
  priceRange: "Price Range",
  from: "From",
  to: "To",
  clearPrice: "Clear Price",
  hideFilters: "Hide Filters",
  showFilters: "Show Filters",
  categoryCount: "Category",
  brandCount: "Brand",
  attrCount: "Attribute",
  loading: "Loading...",
  productCount: "Product",
  noProducts: "No products match the selected filters",
  clearAllFilters: "Clear all filters"
};

Object.assign(ar.catalog, catalogAr);
Object.assign(en.catalog, catalogEn);

// Products Page
if (!ar.products) ar.products = {};
if (!en.products) en.products = {};

const productsAr = {
  productsLabel: "المنتجات",
  fullCollection: "تشكيلتنا الكاملة",
  chooseFromHundreds: "اختر من بين مئات المنتجات"
};

const productsEn = {
  productsLabel: "Products",
  fullCollection: "Our Full Collection",
  chooseFromHundreds: "Choose from hundreds of products"
};

Object.assign(ar.products, productsAr);
Object.assign(en.products, productsEn);

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for storefront');
