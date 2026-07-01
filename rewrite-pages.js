const fs = require('fs');
const path = require('path');

const map = {
  'attribute-types': { key: 'attributeTypes', component: 'AttributeTypesQuickAdmin' },
  'audit-logs': { key: 'auditLogs', component: 'AuditLogsQuickAdmin' },
  'brands': { key: 'brands', component: 'BrandsQuickAdmin' },
  'categories': { key: 'categories', component: 'CategoriesQuickAdmin' },
  'customers': { key: 'customers', component: 'CustomersQuickAdmin' },
  'dashboard': { key: 'dashboard', component: 'DashboardQuickAdmin' },
  'discounts': { key: 'discounts', component: 'DiscountsQuickAdmin' },
  'exchanges': { key: 'exchanges', component: 'ExchangesQuickAdmin' },
  'homepage': { key: 'homepage', component: 'HomepageQuickAdmin' },
  'loyalty-settings': { key: 'loyaltySettings', component: 'LoyaltySettingsQuickAdmin' },
  'notifications': { key: 'notifications', component: 'NotificationsQuickAdmin' },
  'orders': { key: 'orders', component: 'OrdersQuickAdmin' },
  'products': { key: 'products', component: 'ProductsQuickAdmin' },
  'reviews': { key: 'reviews', component: 'ReviewsQuickAdmin' },
  'settings': { key: 'settings', component: 'SettingsQuickAdmin' },
  'shipping-rates': { key: 'shippingRates', component: 'ShippingRatesQuickAdmin' },
  'sub-admins': { key: 'subAdmins', component: 'SubAdminsQuickAdmin' }
};

const basePath = 'apps/admin/src/app/(dashboard)';

for (const [dir, { key, component }] of Object.entries(map)) {
  const pagePath = path.join(basePath, dir, 'page.tsx');
  if (fs.existsSync(pagePath)) {
    const content = "import { getTranslations } from 'next-intl/server';\n" +
"import " + component + " from './" + component + "';\n\n" +
"export async function generateMetadata() {\n" +
"  const t = await getTranslations('nav');\n" +
"  return { title: `${t('" + key + "')} | EuroStore Admin` };\n" +
"}\n\n" +
"export default function " + component.replace('QuickAdmin', 'Page') + "() {\n" +
"  return <" + component + " />;\n" +
"}\n";
    fs.writeFileSync(pagePath, content);
    console.log("Updated " + pagePath);
  }
}
