const fs = require('fs');

const path = 'apps/web/src/app/(main)/products/[slug]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add translation setup
content = content.replace("const t = useTranslations('catalog');", "const t = useTranslations('catalog');\n  const td = useTranslations('productDetails');");

// 1. Loading
content = content.replace(/<p className="text-sm text-\[#6F6658\]">جاري التحميل\.\.\.<\/p>/, '<p className="text-sm text-[#6F6658]">{td(\'loading\')}</p>');

// 2. Not found
content = content.replace(/label="المنتج غير موجود"/g, 'label={td(\'notFoundImage\')}');
content = content.replace(/<p className="text-2xl font-black text-\[#1F1B16\]">المنتج غير موجود<\/p>/, '<p className="text-2xl font-black text-[#1F1B16]">{td(\'notFoundTitle\')}</p>');
content = content.replace(/عودة للمنتجات/g, '{td(\'backToProducts\')}');

// 3. Breadcrumbs
content = content.replace(/>الرئيسية</g, '>{td(\'home\')}<');
content = content.replace(/>المنتجات</g, '>{td(\'products\')}<');

// 4. Image labels
content = content.replace(/label="صورة المنتج"/g, 'label={td(\'productImage\')}');
content = content.replace(/label="صورة"/g, 'label={td(\'image\')}');

// 5. Variants & Stock counters
content = content.replace(/\{variants.length\} متغير/g, '{variants.length} {td(\'variant\')}');
content = content.replace(/المخزون الكلي: \{totalStock\}/g, '{td(\'totalStock\')} {totalStock}');
content = content.replace(/المتغير المحدد/g, '{td(\'selectedVariant\')}');
content = content.replace(/<Palette className="h-4 w-4 text-\[#C9A84C\]" \/> اللون/g, '<Palette className="h-4 w-4 text-[#C9A84C]" /> {td(\'color\')}');
content = content.replace(/<Ruler className="h-4 w-4 text-\[#C9A84C\]" \/> المقاس/g, '<Ruler className="h-4 w-4 text-[#C9A84C]" /> {td(\'size\')}');
content = content.replace(/<Boxes className="h-4 w-4 text-\[#C9A84C\]" \/> المخزون/g, '<Boxes className="h-4 w-4 text-[#C9A84C]" /> {td(\'stock\')}');
content = content.replace(/\{selectedStock\} قطعة/g, '{selectedStock} {td(\'pieces\')}');
content = content.replace(/تفاصيل إضافية/g, '{td(\'extraDetails\')}');

// 6. No variants / Choose variant
content = content.replace(/لا توجد متغيرات متاحة حالياً/g, '{td(\'noVariants\')}');
content = content.replace(/اختر المتغير المناسب/g, '{td(\'chooseVariant\')}');

// 7. Variant loop details
content = content.replace(/لون: \{v.color\}/g, '{td(\'colorLabel\')}: {v.color}');
content = content.replace(/مقاس: \{v.size\}/g, '{td(\'sizeLabel\')}: {v.size}');
content = content.replace(/\{qty > 0 \? `\$\{qty\} قطعة` : 'نفذ'\}/g, '{qty > 0 ? `${qty} ${td(\'pieces\')}` : td(\'outOfStockShort\')}');

// 8. Buttons
content = content.replace(/\{added \? '✓ تمت الإضافة إلى السلة' : 'أضف إلى السلة'\}/g, '{added ? td(\'addedToCart\') : td(\'addToCart\')}');
content = content.replace(/\{selected \? 'نفذ المخزون' : 'اختر المتغير أولاً'\}/g, '{selected ? td(\'outOfStockLong\') : td(\'chooseVariantFirst\')}');

// 9. Category
content = content.replace(/التصنيف:\{' '\}/g, '{td(\'category\')} ');

// 10. Update stockState function at the top
content = content.replace(
  /function stockState\(qty: number\) \{[\s\S]*?return \{ text: `متوفر: \$\{qty\}`/m,
  `function stockState(qty: number, td: any) {
  if (qty <= 0) return { text: td('outOfStockLong'), Icon: XCircle, cls: 'bg-red-50 border-red-200 text-red-700' };
  if (qty <= 5) return { text: \`\${td('lowStock')} \${qty}\`, Icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-700' };
  return { text: \`\${td('available')} \${qty}\``
);

content = content.replace(/const selectedState = stockState\(selectedStock\);/, 'const selectedState = stockState(selectedStock, td);');

// 11. Variant title fix
content = content.replace(/return parts.length \? parts.join\(' \/ '\) : 'متغير';/, "return parts.length ? parts.join(' / ') : td('variant');");
content = content.replace(/\{variantTitle\(selected\)\}/, "{variantTitle(selected, td)}");
content = content.replace(/\{variantTitle\(v\)\}/, "{variantTitle(v, td)}");
content = content.replace(/function variantTitle\(v: any\)/, "function variantTitle(v: any, td: any)");

fs.writeFileSync(path, content);
console.log('Done');
