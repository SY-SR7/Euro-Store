const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminReviews = {
  reviewsTitle: "تقييمات المنتجات",
  reviewsDesc: "مراجعة واعتماد تقييمات العملاء، وتعديل أي حقل بضغطة واحدة",
  pendingTab: "بانتظار المراجعة",
  approvedTab: "معتمدة",
  rejectedTab: "مرفوضة",
  allTab: "الكل",
  noComment: "لا يوجد تعليق",
  starsCount: "{count} نجوم",
  statusPending: "بانتظار المراجعة",
  statusApproved: "معتمد",
  statusRejected: "مرفوض",
  noReviews: "لا توجد تقييمات في هذا القسم",
  defaultCustomer: "عميل",
  approveBtn: "اعتماد",
  rejectBtn: "رفض",
  ratingLabel: "التقييم",
  commentLabel: "التعليق",
  statusLabel: "الحالة",
  productLabel: "المنتج",
  customerLabel: "العميل",
  dateLabel: "تاريخ التقييم",
  defaultProduct: "تقييم",
  emptyProduct: "—"
};

en.adminReviews = {
  reviewsTitle: "Product Reviews",
  reviewsDesc: "Review and approve customer reviews, and edit any field with one click",
  pendingTab: "Pending",
  approvedTab: "Approved",
  rejectedTab: "Rejected",
  allTab: "All",
  noComment: "No comment",
  starsCount: "{count} stars",
  statusPending: "Pending",
  statusApproved: "Approved",
  statusRejected: "Rejected",
  noReviews: "No reviews in this section",
  defaultCustomer: "Customer",
  approveBtn: "Approve",
  rejectBtn: "Reject",
  ratingLabel: "Rating",
  commentLabel: "Comment",
  statusLabel: "Status",
  productLabel: "Product",
  customerLabel: "Customer",
  dateLabel: "Date",
  defaultProduct: "Review",
  emptyProduct: "—"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for Reviews');
