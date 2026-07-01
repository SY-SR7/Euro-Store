const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminShippingRates = {
  shippingRatesTitle: "أسعار الشحن",
  countGovernorates: "{count} محافظة",
  tableGovernorate: "المحافظة",
  tableShippingRate: "سعر الشحن",
  tableFreeShippingOver: "مجاني فوق",
  tableStatus: "الحالة",
  statusActive: "نشط",
  statusDisabled: "معطّل",
  failedToLoadRate: "تعذر فتح سعر الشحن",
  noShippingRates: "لا توجد أسعار شحن",
  emptyField: "—",
  freeShippingAbove: "شحن مجاني فوق",
  unitSyp: "ل.س"
};

en.adminShippingRates = {
  shippingRatesTitle: "Shipping Rates",
  countGovernorates: "{count} Governorates",
  tableGovernorate: "Governorate",
  tableShippingRate: "Shipping Rate",
  tableFreeShippingOver: "Free Over",
  tableStatus: "Status",
  statusActive: "Active",
  statusDisabled: "Disabled",
  failedToLoadRate: "Failed to load shipping rate",
  noShippingRates: "No shipping rates",
  emptyField: "—",
  freeShippingAbove: "Free Shipping Above",
  unitSyp: "SYP"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for ShippingRates');
