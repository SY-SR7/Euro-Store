const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminExchanges = {
  exchangesTitle: "طلبات الاستبدال",
  exchangesCount: "{count} طلب",
  all: "الكل",
  noExchanges: "لا توجد طلبات استبدال",
  id: "الرقم",
  reason: "السبب",
  status: "الحالة",
  requestDate: "تاريخ الطلب",
  exchangeRequestHeader: "طلب استبدال #{id}",
  statusPending: "قيد الانتظار",
  statusApproved: "تمت الموافقة",
  statusRejected: "مرفوض",
  statusCompleted: "مكتمل",
  reasonAr: "السبب العربي",
  reasonEn: "السبب الإنجليزي",
  adminNotes: "ملاحظات الإدارة",
  orderId: "رقم الطلب",
  customerImages: "صور العميل",
  noImages: "لا توجد صور",
  imageFallback: "صورة {index}",
  failedToLoadDetails: "تعذر تحميل التفاصيل"
};

en.adminExchanges = {
  exchangesTitle: "Exchange Requests",
  exchangesCount: "{count} requests",
  all: "All",
  noExchanges: "No exchange requests found",
  id: "ID",
  reason: "Reason",
  status: "Status",
  requestDate: "Request Date",
  exchangeRequestHeader: "Exchange Request #{id}",
  statusPending: "Pending",
  statusApproved: "Approved",
  statusRejected: "Rejected",
  statusCompleted: "Completed",
  reasonAr: "Reason (Arabic)",
  reasonEn: "Reason (English)",
  adminNotes: "Admin Notes",
  orderId: "Order ID",
  customerImages: "Customer Images",
  noImages: "No images",
  imageFallback: "Image {index}",
  failedToLoadDetails: "Failed to load details"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for Exchanges');
