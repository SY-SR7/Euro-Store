const fs = require('fs');

const arPath = 'apps/web/src/i18n/messages/ar.json';
const enPath = 'apps/web/src/i18n/messages/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!ar.home) ar.home = {};
if (!en.home) en.home = {};

ar.home.hero = {
  collection: "تشكيلة يوروستور",
  words: ["يُرتدى", "بأناقة،", "يُعاش", "بثقة"],
  subtitle: "اكتشف أحدث صيحات الموضة من أشهر الماركات العالمية بتصاميم تناسب ذوقك الراقي وتلبي تطلعاتك.",
  shopNow: "تسوق الآن",
  explore: "اكتشف المجموعات",
  stats: {
    exclusive: "ماركة حصرية",
    customers: "عميل مميز",
    categoriesNum: "15+",
    categories: "قسم للتسوق"
  },
  scrollDown: "مرر للأسفل"
};

en.home.hero = {
  collection: "EuroStore Collection",
  words: ["Worn", "with style,", "lived", "with confidence"],
  subtitle: "Discover the latest fashion trends from world-renowned brands, tailored to your exquisite taste.",
  shopNow: "Shop Now",
  explore: "Explore Collections",
  stats: {
    exclusive: "Exclusive Brands",
    customers: "Premium Clients",
    categoriesNum: "15+",
    categories: "Shopping Depts"
  },
  scrollDown: "Scroll Down"
};

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log("home.hero translation updated");
