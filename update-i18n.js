const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

ar.common = ar.common || {};
en.common = en.common || {};
ar.common.saved = 'تم الحفظ';
en.common.saved = 'Saved';
ar.common.saveFailed = 'فشل الحفظ';
en.common.saveFailed = 'Save Failed';
ar.common.searchByNamePhoneEmail = 'بحث بالاسم أو الهاتف أو البريد...';
en.common.searchByNamePhoneEmail = 'Search by name, phone or email...';

ar.adminCustomers = {
  customersTitle: 'العملاء',
  customersCount: '{count} عميل',
  noCustomers: 'لا يوجد عملاء',
  failedToOpenCustomer: 'تعذر فتح العميل',
  directEditFromPanel: 'تعديل مباشر من لوحة العملاء',
  failedToUpdatePoints: 'فشل تعديل النقاط',
  statusActive: 'نشط',
  statusBlocked: 'محظور',
  name: 'الاسم',
  phone: 'الهاتف',
  email: 'البريد',
  points: 'النقاط',
  status: 'الحالة',
  registrationDate: 'تاريخ التسجيل',
  referralCode: 'كود الإحالة',
  customerFallback: 'عميل'
};

en.adminCustomers = {
  customersTitle: 'Customers',
  customersCount: '{count} customers',
  noCustomers: 'No customers found',
  failedToOpenCustomer: 'Failed to open customer',
  directEditFromPanel: 'Direct edit from customers panel',
  failedToUpdatePoints: 'Failed to update points',
  statusActive: 'Active',
  statusBlocked: 'Blocked',
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  points: 'Points',
  status: 'Status',
  registrationDate: 'Registration Date',
  referralCode: 'Referral Code',
  customerFallback: 'Customer'
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files');
