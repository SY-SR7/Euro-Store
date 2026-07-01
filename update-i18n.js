const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminHomepage = {
  homepageTitle: "الواجهة الرئيسية",
  sectionsCount: "{count} قسم",
  newSection: "قسم جديد",
  sectionKeyHero: "Hero",
  sectionKeyFeatured: "منتجات مميزة",
  sectionKeyCategories: "شبكة التصنيفات",
  sectionKeyPromotions: "العروض",
  sectionKeyLoyalty: "الولاء",
  sectionKeyNewArrivals: "وصل حديثا",
  titleAr: "العنوان العربي",
  titleEn: "العنوان الإنجليزي",
  sortOrder: "الترتيب",
  addBtn: "إضافة",
  noSections: "لا توجد أقسام",
  section: "القسم",
  title: "العنوان",
  status: "الحالة",
  statusVisible: "مرئي",
  statusHidden: "مخفي",
  sectionType: "نوع القسم",
  deleteSection: "حذف القسم",
  confirmDelete: "حذف هذا القسم؟",
  failedToLoadSection: "تعذر فتح القسم"
};

en.adminHomepage = {
  homepageTitle: "Homepage",
  sectionsCount: "{count} sections",
  newSection: "New Section",
  sectionKeyHero: "Hero",
  sectionKeyFeatured: "Featured Products",
  sectionKeyCategories: "Categories Grid",
  sectionKeyPromotions: "Promotions",
  sectionKeyLoyalty: "Loyalty",
  sectionKeyNewArrivals: "New Arrivals",
  titleAr: "Arabic Title",
  titleEn: "English Title",
  sortOrder: "Sort Order",
  addBtn: "Add",
  noSections: "No sections found",
  section: "Section",
  title: "Title",
  status: "Status",
  statusVisible: "Visible",
  statusHidden: "Hidden",
  sectionType: "Section Type",
  deleteSection: "Delete Section",
  confirmDelete: "Delete this section?",
  failedToLoadSection: "Failed to open section"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for Homepage');
