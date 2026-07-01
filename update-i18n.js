const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminSettings = {
  settingsTitle: "إعدادات النظام",
  settingsDesc: "القيم العامة",
  usd_exchange_rate: "سعر الدولار",
  max_exchange_days: "مدة الاستبدال",
  loyalty_earn_amount_syp: "مبلغ كسب النقاط",
  loyalty_earn_points: "نقاط الكسب",
  loyalty_redeem_points_per_syp: "نقاط كل ليرة",
  loyalty_max_redeem_percent: "حد خصم النقاط",
  loyalty_referral_bonus_points: "مكافأة الإحالة",
  referral_bonus_points: "إحالة قديمة",
  groupSystem: "النظام",
  groupLoyalty: "الولاء",
  unitSyp: "ل.س",
  unitDays: "يوم",
  unitPoints: "نقطة",
  unitPercent: "%"
};

en.adminSettings = {
  settingsTitle: "System Settings",
  settingsDesc: "General Values",
  usd_exchange_rate: "USD Exchange Rate",
  max_exchange_days: "Exchange Duration",
  loyalty_earn_amount_syp: "Points Earn Amount",
  loyalty_earn_points: "Earn Points",
  loyalty_redeem_points_per_syp: "Points Per SYP",
  loyalty_max_redeem_percent: "Max Points Discount",
  loyalty_referral_bonus_points: "Referral Bonus",
  referral_bonus_points: "Old Referral Bonus",
  groupSystem: "System",
  groupLoyalty: "Loyalty",
  unitSyp: "SYP",
  unitDays: "Days",
  unitPoints: "Pts",
  unitPercent: "%"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for Settings');
