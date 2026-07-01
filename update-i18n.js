const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminDiscounts = {
  discountsTitle: "الخصومات",
  discountsCount: "{count} كود خصم",
  newDiscount: "كود جديد",
  code: "الكود",
  type: "النوع",
  typePercentage: "نسبة %",
  typeFixed: "مبلغ ثابت",
  value: "القيمة",
  minOrder: "الحد الأدنى",
  validFrom: "صالح من",
  validUntil: "صالح حتى",
  maxUses: "أقصى استخدام",
  createBtn: "إنشاء",
  noDiscounts: "لا توجد أكواد خصم",
  statusActive: "نشط",
  statusInactive: "معطّل",
  uses: "الاستخدامات",
  status: "الحالة",
  discountCodeHeader: "كود: {code}",
  dateRange: "النطاق",
  failedToOpenCode: "تعذر فتح الكود",
  percentage: "نسبة",
  fixed: "ثابت"
};

en.adminDiscounts = {
  discountsTitle: "Discounts",
  discountsCount: "{count} discount codes",
  newDiscount: "New Code",
  code: "Code",
  type: "Type",
  typePercentage: "Percentage %",
  typeFixed: "Fixed Amount",
  value: "Value",
  minOrder: "Min Order",
  validFrom: "Valid From",
  validUntil: "Valid Until",
  maxUses: "Max Uses",
  createBtn: "Create",
  noDiscounts: "No discount codes found",
  statusActive: "Active",
  statusInactive: "Disabled",
  uses: "Uses",
  status: "Status",
  discountCodeHeader: "Code: {code}",
  dateRange: "Range",
  failedToOpenCode: "Failed to open code",
  percentage: "Percentage",
  fixed: "Fixed"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for Discounts');
