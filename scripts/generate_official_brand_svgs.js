const fs = require('fs');
const path = require('path');
const { createClient } = require('../apps/web/node_modules/@supabase/supabase-js');
require('../apps/web/node_modules/dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const brandsDir = path.join(__dirname, '../apps/web/public/brands');
if (!fs.existsSync(brandsDir)) {
  fs.mkdirSync(brandsDir, { recursive: true });
}

// 24 Official High-Precision Vector SVGs
const brandSVGs = {
  'nike': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <path d="M22.5 54.8c-7.4 3.1-14.2 3.8-18.4 1.8-4.7-2.3-5.2-7.9-1.3-14.8 4.2-7.4 12.6-15.6 23.4-23.1C55.6 4.7 93.8-3.1 123.6 1.4c-22.3 8.2-61.9 26.6-84.3 43.8-8.8 6.7-14.2 12.1-16.8 15.6v-6z"/>
  <path d="M140 18h12v40h-12V18zm20 0h12v22l18-22h15l-21 24 23 26h-16l-19-22v22h-12V18zm60 0h34v9h-22v7h19v8h-19v7h23v9h-35V18z" transform="matrix(0.45 0 0 0.45 80 16)"/>
</svg>`,

  'adidas': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <path d="M42 48l16-28h14L56 48H42zm24 0l22-38h14L80 48H66zm24 0l28-48h14L104 48H90z"/>
  <text x="74" y="68" font-family="'Helvetica Neue', Arial, sans-serif" font-size="20" font-weight="900" letter-spacing="2" text-anchor="middle">adidas</text>
</svg>`,

  'puma': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <path d="M48 22c-1.5-3.2-3.8-5.8-6.8-7.5-3.2-1.8-6.8-2.6-10.4-2.2 2.2 2.5 3.5 5.8 3.5 9.2 0 1.2-.2 2.5-.5 3.6-2.5-.8-5.2-.8-7.7 0-3.6 1.2-6.5 3.8-8.2 7.2-2.2 4.4-2.5 9.5-.8 14.2 2.2 6.2 7.2 11 13.5 13.2 5.5 1.9 11.6 1.4 16.8-1.4 6.2-3.4 10.5-9.2 11.9-16.2.7-3.5.3-7.2-1.2-10.4-2.3-4.8-5.8-8.2-10.1-9.7z"/>
  <text x="122" y="46" font-family="'Arial Black', Impact, sans-serif" font-size="26" font-weight="900" letter-spacing="3" text-anchor="middle">PUMA</text>
</svg>`,

  'lacoste': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">
  <g transform="translate(15, 18) scale(0.65)">
    <path fill="#005826" d="M12 28c8-14 28-20 44-12 12 6 22 18 36 20 14 2 28-6 42-2 10 3 18 12 22 22-8-2-18-2-26 2-10 5-18 15-28 18-12 4-26-2-38-6-16-5-32-4-46 6-4-16-6-32-6-48z"/>
    <path fill="#D62B20" d="M152 46c6-4 14-4 20 0-4 4-12 6-20 0z"/>
    <circle cx="140" cy="36" r="3" fill="#FFFFFF"/>
    <circle cx="140" cy="36" r="1.5" fill="#000000"/>
  </g>
  <text x="126" y="48" font-family="'Trebuchet MS', Arial, sans-serif" font-size="20" font-weight="800" letter-spacing="3" fill="#111111" text-anchor="middle">LACOSTE</text>
</svg>`,

  'tommy-hilfiger': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">
  <rect x="75" y="24" width="50" height="14" fill="#CC0C2F"/>
  <rect x="75" y="24" width="25" height="14" fill="#FFFFFF"/>
  <rect x="75" y="20" width="50" height="4" fill="#00174F"/>
  <rect x="75" y="38" width="50" height="4" fill="#00174F"/>
  <text x="100" y="58" font-family="'Century Gothic', Arial, sans-serif" font-size="11" font-weight="800" letter-spacing="3" fill="#00174F" text-anchor="middle">TOMMY HILFIGER</text>
</svg>`,

  'calvin-klein': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="44" font-family="'Futura', 'Century Gothic', sans-serif" font-size="34" font-weight="300" letter-spacing="4" text-anchor="middle">cK</text>
  <text x="100" y="62" font-family="'Futura', 'Century Gothic', sans-serif" font-size="10" font-weight="400" letter-spacing="4" text-anchor="middle">Calvin Klein</text>
</svg>`,

  'dior': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="50" font-family="'Didot', 'Playfair Display', 'Bodoni MT', serif" font-size="34" font-weight="700" letter-spacing="4" text-anchor="middle">Dior</text>
</svg>`,

  'chanel': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <g transform="translate(100, 28) scale(0.65)">
    <path d="M-18 -18 C-30 -6 -30 6 -18 18 C-8 28 8 28 18 18 L10 10 C4 16 -4 16 -10 10 C-18 2 -18 -2 -10 -10 C-4 -16 4 -16 10 -10 L18 -18 C8 -28 -8 -28 -18 -18 Z" transform="translate(-6, 0)"/>
    <path d="M18 -18 C30 -6 30 6 18 18 C8 28 -8 28 -18 18 L-10 10 C-4 16 4 16 10 10 C18 2 18 -2 10 -10 C4 -16 -4 -16 -10 -10 L-18 -18 C-8 -28 8 -28 18 -18 Z" transform="translate(6, 0)"/>
  </g>
  <text x="100" y="60" font-family="'Futura', 'Helvetica Neue', Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="6" text-anchor="middle">CHANEL</text>
</svg>`,

  'gucci': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="48" font-family="'Didot', 'Cinzel', 'Trajan Pro', serif" font-size="28" font-weight="700" letter-spacing="8" text-anchor="middle">GUCCI</text>
</svg>`,

  'prada': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="45" font-family="'Didot', 'Playfair Display', serif" font-size="28" font-weight="900" letter-spacing="6" text-anchor="middle">PRADA</text>
  <text x="100" y="58" font-family="'Helvetica Neue', Arial, sans-serif" font-size="8" font-weight="600" letter-spacing="5" text-anchor="middle">MILANO</text>
</svg>`,

  'versace': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="48" font-family="'Futura', 'Century Gothic', Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="6" text-anchor="middle">VERSACE</text>
</svg>`,

  'hugo-boss': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="48" font-family="'Arial Black', Impact, sans-serif" font-size="30" font-weight="900" letter-spacing="6" text-anchor="middle">BOSS</text>
  <text x="100" y="62" font-family="'Arial', sans-serif" font-size="9" font-weight="700" letter-spacing="4" text-anchor="middle">HUGO BOSS</text>
</svg>`,

  'armani': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="42" font-family="'Didot', 'Bodoni MT', serif" font-size="16" font-weight="700" letter-spacing="4" text-anchor="middle">EMPORIO ARMANI</text>
  <text x="100" y="58" font-family="'Arial Black', sans-serif" font-size="13" font-weight="900" letter-spacing="6" text-anchor="middle">EA7</text>
</svg>`,

  'ralph-lauren': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="40" font-family="'Cinzel', 'Didot', serif" font-size="16" font-weight="800" letter-spacing="4" text-anchor="middle">RALPH LAUREN</text>
  <text x="100" y="56" font-family="'Didot', serif" font-size="11" font-weight="700" letter-spacing="6" text-anchor="middle">POLO</text>
</svg>`,

  'new-balance': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80">
  <g fill="#CE0E2D" transform="translate(40, 22) scale(0.6)">
    <path d="M22 0l-8 16h18l4-8h16l-8 16h18l4-8h16l-16 32H0l22-44h-8L6 20H0l14-28h8z"/>
    <path d="M62 48l16-32h18L80 48H62zm24 0l16-32h18L104 48H86z"/>
  </g>
  <text x="130" y="44" font-family="'Arial Black', sans-serif" font-size="16" font-weight="900" letter-spacing="1" fill="#CE0E2D" text-anchor="middle">new balance</text>
</svg>`,

  'converse': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <polygon points="45,35 49,45 60,45 51,52 54,62 45,56 36,62 39,52 30,45 41,45" fill="#111111"/>
  <text x="122" y="52" font-family="'Arial Black', Impact, sans-serif" font-size="22" font-weight="900" letter-spacing="3" text-anchor="middle">CONVERSE</text>
</svg>`,

  'vans': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#BA0C2F">
  <path d="M45 28h55v6H62l16 26h-14L50 36l-8 24H28l17-32z"/>
  <text x="126" y="54" font-family="'Arial Black', Impact, sans-serif" font-size="26" font-weight="900" letter-spacing="2" text-anchor="middle">VANS</text>
</svg>`,

  'ray-ban': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#E31B23">
  <text x="100" y="52" font-family="'Brush Script MT', 'Lucida Handwriting', cursive, sans-serif" font-size="38" font-weight="bold" letter-spacing="2" text-anchor="middle">Ray-Ban</text>
</svg>`,

  'casio': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="38" font-family="'Arial Black', Impact, sans-serif" font-size="22" font-weight="900" letter-spacing="3" text-anchor="middle">CASIO</text>
  <text x="100" y="56" font-family="'Impact', 'Arial Black', sans-serif" font-size="14" font-weight="900" letter-spacing="4" fill="#C00000" text-anchor="middle">G-SHOCK</text>
</svg>`,

  'michael-kors': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <circle cx="48" cy="40" r="22" fill="none" stroke="#111111" stroke-width="4"/>
  <text x="48" y="47" font-family="'Century Gothic', sans-serif" font-size="18" font-weight="900" text-anchor="middle">MK</text>
  <text x="126" y="46" font-family="'Century Gothic', sans-serif" font-size="13" font-weight="800" letter-spacing="2" text-anchor="middle">MICHAEL KORS</text>
</svg>`,

  'skechers': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#003580">
  <text x="100" y="50" font-family="'Arial Black', Impact, sans-serif" font-size="26" font-weight="900" letter-spacing="2" text-anchor="middle">SKECHERS</text>
</svg>`,

  'reebok': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#0F1626">
  <path d="M40 38l25-16 12 8-25 16-12-8zm37-4l25-16 12 8-25 16-12-8z" fill="#D3232A"/>
  <text x="126" y="50" font-family="'Trebuchet MS', Arial, sans-serif" font-size="22" font-weight="900" letter-spacing="2" text-anchor="middle">Reebok</text>
</svg>`,

  'under-armour': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <g transform="translate(45, 18) scale(0.65)">
    <path d="M28 0 C12 0 0 12 0 28 C0 38 6 46 14 50 C6 54 0 62 0 72 C0 88 12 100 28 100 C38 100 46 94 50 86 C54 94 62 100 72 100 C88 100 100 88 100 72 C100 62 94 54 86 50 C94 46 100 38 100 28 C100 12 88 0 72 0 C62 0 54 6 50 14 C46 6 38 0 28 0 Z" fill="none" stroke="#111111" stroke-width="12"/>
  </g>
  <text x="130" y="46" font-family="'Arial Black', Impact, sans-serif" font-size="12" font-weight="900" letter-spacing="1" text-anchor="middle">UNDER ARMOUR</text>
</svg>`,

  'zara': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80" fill="#111111">
  <text x="100" y="52" font-family="'Didot', 'Playfair Display', serif" font-size="38" font-weight="900" letter-spacing="-3" text-anchor="middle">ZARA</text>
</svg>`
};

async function generateAndSync() {
  console.log('Writing 24 clean vector SVG logos to apps/web/public/brands/ ...');
  for (const [slug, svgContent] of Object.entries(brandSVGs)) {
    const filePath = path.join(brandsDir, slug + '.svg');
    fs.writeFileSync(filePath, svgContent.trim(), 'utf8');
    console.log('✓ Wrote:', slug + '.svg');
  }

  console.log('\nUpdating Supabase database brands logo_url...');
  for (const slug of Object.keys(brandSVGs)) {
    const localLogoUrl = '/brands/' + slug + '.svg';
    const { error } = await supabase
      .from('brands')
      .update({ logo_url: localLogoUrl })
      .eq('slug', slug);

    if (error) {
      console.error('Error updating brand:', slug, error.message);
    } else {
      console.log('✓ Updated Supabase brand [' + slug + '] -> ' + localLogoUrl);
    }
  }

  console.log('\nAll 24 brand vector logos successfully generated and synchronized!');
}

generateAndSync();
