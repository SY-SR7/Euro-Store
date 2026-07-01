const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminDashboard = {
  title: "لوحة التحكم",
  loadingStatus: "جار تحميل البيانات",
  readyStatus: "جاهزة",
  failedToLoad: "تعذر تحميل لوحة التحكم",
  notificationsBtn: "الإشعارات",
  openBtn: "فتح",
  allLink: "الكل",
  latestOrders: "آخر الطلبات",
  noOrders: "لا توجد طلبات",
  pendingExchangesTitle: "استبدالات بانتظار القرار",
  noPendingExchanges: "لا توجد طلبات معلقة",
  cardRevenue: "الإيرادات",
  cardOrders: "الطلبات",
  cardCustomers: "العملاء",
  cardProducts: "المنتجات",
  cardExchanges: "الاستبدالات",
  unspecifiedCustomer: "عميل غير محدد",
  noReason: "بدون سبب",
  actionNewProduct: "منتج جديد",
  actionDiscountCode: "كود خصم",
  actionAuditLogs: "سجل النشاط",
  actionSettings: "الإعدادات",
  orderStatusPending: "قيد الانتظار",
  orderStatusConfirmed: "مؤكد",
  orderStatusProcessing: "جار التجهيز",
  orderStatusShipped: "تم الشحن",
  orderStatusDelivered: "تم التسليم",
  orderStatusCancelled: "ملغى",
  exchangeStatusApproved: "مقبول",
  exchangeStatusRejected: "مرفوض",
  exchangeStatusCompleted: "مكتمل"
};

en.adminDashboard = {
  title: "Dashboard",
  loadingStatus: "Loading data...",
  readyStatus: "Ready",
  failedToLoad: "Failed to load dashboard",
  notificationsBtn: "Notifications",
  openBtn: "Open",
  allLink: "All",
  latestOrders: "Latest Orders",
  noOrders: "No orders found",
  pendingExchangesTitle: "Pending Exchanges",
  noPendingExchanges: "No pending requests",
  cardRevenue: "Revenue",
  cardOrders: "Orders",
  cardCustomers: "Customers",
  cardProducts: "Products",
  cardExchanges: "Exchanges",
  unspecifiedCustomer: "Unspecified Customer",
  noReason: "No reason",
  actionNewProduct: "New Product",
  actionDiscountCode: "Discount Code",
  actionAuditLogs: "Audit Logs",
  actionSettings: "Settings",
  orderStatusPending: "Pending",
  orderStatusConfirmed: "Confirmed",
  orderStatusProcessing: "Processing",
  orderStatusShipped: "Shipped",
  orderStatusDelivered: "Delivered",
  orderStatusCancelled: "Cancelled",
  exchangeStatusApproved: "Approved",
  exchangeStatusRejected: "Rejected",
  exchangeStatusCompleted: "Completed"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for Dashboard');
