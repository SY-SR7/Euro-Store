const fs = require('fs');

const arPath = 'apps/admin/src/i18n/messages/ar.json';
const enPath = 'apps/admin/src/i18n/messages/en.json';

const arContent = fs.readFileSync(arPath, 'utf8').replace(/^\uFEFF/, '');
const enContent = fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, '');

const ar = JSON.parse(arContent);
const en = JSON.parse(enContent);

ar.adminLoyaltySettings = {
  loyaltyTitle: "الولاء",
  loyaltyDesc: "القيم المهمة فقط، وكل قيمة تتعدل من مكانها",
  loyalty_earn_amount_syp: "مبلغ كسب النقاط",
  loyalty_earn_points: "نقاط الكسب",
  loyalty_redeem_points_per_syp: "نقاط كل ليرة خصم",
  loyalty_max_redeem_percent: "أقصى خصم بالنقاط",
  loyalty_referral_bonus_points: "مكافأة الإحالة",
  unitSyp: "ل.س",
  unitPoints: "نقطة",
  unitPercent: "%",
  earn: "الكسب",
  every: "كل {amount} = {points} نقطة",
  redeemLabel: "{points} نقطة = {amount}",
  redeem: "الاستبدال",
  order50k: "طلب 50,000",
  referral: "الإحالة"
};

en.adminLoyaltySettings = {
  loyaltyTitle: "Loyalty",
  loyaltyDesc: "Important values only, each modified in place",
  loyalty_earn_amount_syp: "Points Earn Amount",
  loyalty_earn_points: "Earn Points",
  loyalty_redeem_points_per_syp: "Points per SYP Discount",
  loyalty_max_redeem_percent: "Max Points Discount",
  loyalty_referral_bonus_points: "Referral Bonus",
  unitSyp: "SYP",
  unitPoints: "Pts",
  unitPercent: "%",
  earn: "Earn",
  every: "Every {amount} = {points} pts",
  redeemLabel: "{points} pts = {amount}",
  redeem: "Redeem",
  order50k: "50,000 Order",
  referral: "Referral"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('Updated i18n files for LoyaltySettings');
