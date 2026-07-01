const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminAuditLogs = {
  title: "سجل النشاط",
  countLogs: "{count} حركة",
  failedToLoad: "تعذر تحميل السجل",
  failedToUndo: "فشل التراجع",
  undoneSuccess: "تم التراجع",
  undoing: "جار التراجع...",
  undone: "تم التراجع",
  undoBtn: "تراجع",
  statsTotal: "إجمالي",
  statsUndoable: "قابل للتراجع",
  statsErrors: "أخطاء",
  searchPlaceholder: "بحث...",
  noLogs: "لا توجد حركات",
  defaultAction: "حركة",
  defaultEntity: "system",
  defaultAdmin: "unknown-admin@local",
  badgeUndo: "تراجع",
  detailAdmin: "المشرف",
  detailSection: "القسم",
  detailId: "المعرف",
  detailTime: "الوقت",
  detailPath: "المسار",
  detailMethod: "الطريقة",
  detailResult: "النتيجة",
  detailIp: "IP",
  jsonRequest: "الطلب",
  jsonBefore: "قبل",
  jsonAfter: "بعد",
  noAutoUndo: "لا يوجد تراجع تلقائي",
  undoneAt: "تم التراجع: {date}",
  filterAll: "الكل",
  filterCreate: "إنشاء",
  filterUpdate: "تعديل",
  filterDelete: "حذف",
  filterStatus: "حالة",
  filterUndo: "تراجع",
  methodUi: "UI"
};

en.adminAuditLogs = {
  title: "Audit Logs",
  countLogs: "{count} logs",
  failedToLoad: "Failed to load logs",
  failedToUndo: "Failed to undo",
  undoneSuccess: "Successfully undone",
  undoing: "Undoing...",
  undone: "Undone",
  undoBtn: "Undo",
  statsTotal: "Total",
  statsUndoable: "Undoable",
  statsErrors: "Errors",
  searchPlaceholder: "Search...",
  noLogs: "No logs found",
  defaultAction: "Action",
  defaultEntity: "system",
  defaultAdmin: "unknown-admin@local",
  badgeUndo: "Undo",
  detailAdmin: "Admin",
  detailSection: "Section",
  detailId: "ID",
  detailTime: "Time",
  detailPath: "Path",
  detailMethod: "Method",
  detailResult: "Result",
  detailIp: "IP",
  jsonRequest: "Request",
  jsonBefore: "Before",
  jsonAfter: "After",
  noAutoUndo: "No auto-undo available",
  undoneAt: "Undone at: {date}",
  filterAll: "All",
  filterCreate: "Create",
  filterUpdate: "Update",
  filterDelete: "Delete",
  filterStatus: "Status",
  filterUndo: "Undo",
  methodUi: "UI"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for AuditLogs');
