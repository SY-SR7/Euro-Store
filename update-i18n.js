const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminSubAdmins = {
  title: "المشرفون",
  countAccounts: "{count} حساب",
  newSubAdmin: "مشرف جديد",
  failedToLoadAdmin: "تعذر فتح المشرف",
  createdSuccessfully: "تم إنشاء الحساب",
  creationFailed: "فشل الإنشاء",
  formName: "الاسم",
  formEmail: "email@example.com",
  formPassword: "كلمة المرور",
  formCreating: "جار الإنشاء...",
  formCreate: "إنشاء",
  noAccounts: "لا توجد حسابات",
  tableHeaderName: "الاسم",
  tableHeaderEmail: "البريد",
  tableHeaderDate: "التاريخ",
  tableHeaderStatus: "الحالة",
  statusActive: "نشط",
  statusDisabled: "معطل",
  fieldName: "الاسم",
  fieldEmail: "البريد",
  fieldStatus: "الحالة",
  fieldCreatedAt: "تاريخ الإنشاء"
};

en.adminSubAdmins = {
  title: "Sub-Admins",
  countAccounts: "{count} accounts",
  newSubAdmin: "New Sub-Admin",
  failedToLoadAdmin: "Failed to load sub-admin",
  createdSuccessfully: "Account created successfully",
  creationFailed: "Failed to create",
  formName: "Name",
  formEmail: "email@example.com",
  formPassword: "Password",
  formCreating: "Creating...",
  formCreate: "Create",
  noAccounts: "No accounts found",
  tableHeaderName: "Name",
  tableHeaderEmail: "Email",
  tableHeaderDate: "Date",
  tableHeaderStatus: "Status",
  statusActive: "Active",
  statusDisabled: "Disabled",
  fieldName: "Name",
  fieldEmail: "Email",
  fieldStatus: "Status",
  fieldCreatedAt: "Created At"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for SubAdmins');
