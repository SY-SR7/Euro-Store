const fs = require('fs');
let c = fs.readFileSync('apps/web/src/app/(main)/wishlist/page.tsx', 'utf8');
c = c.replace(/return Number\(n\)\.toLocaleString\('ar-SY'\) \+ ' ل\.س';/, "return Number(n).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en-US') + (locale === 'ar' ? ' ل.س' : ' SYP');");
fs.writeFileSync('apps/web/src/app/(main)/wishlist/page.tsx', c);
console.log('Wishlist updated');
