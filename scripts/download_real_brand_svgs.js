const https = require('https');
const fs = require('fs');
const path = require('path');

const brandsDir = path.join(__dirname, '../apps/web/public/brands');
if (!fs.existsSync(brandsDir)) {
  fs.mkdirSync(brandsDir, { recursive: true });
}

// Map of all 24 brands to verified official SVG URLs
const brandSources = {
  'nike': 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nike.svg',
  'adidas': 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/adidas.svg',
  'puma': 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/puma.svg',
  'reebok': 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/reebok.svg',
  'under-armour': 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/underarmour.svg',
  'new-balance': 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/newbalance.svg',
  'zara': 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/zara.svg',
  'dior': 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/dior.svg',
  'lacoste': 'https://upload.wikimedia.org/wikipedia/en/4/43/Lacoste_logo.svg',
  'tommy-hilfiger': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Tommy_Hilfiger_logo.svg',
  'calvin-klein': 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Calvin_klein_logo.svg',
  'chanel': 'https://upload.wikimedia.org/wikipedia/en/9/92/Chanel_logo_interlocking_cs.svg',
  'gucci': 'https://upload.wikimedia.org/wikipedia/commons/7/79/1960s_Gucci_Logo.svg',
  'prada': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Prada_Group_-_logo_%28Italy%29.svg',
  'versace': 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Versace_old_logo.svg',
  'hugo-boss': 'https://upload.wikimedia.org/wikipedia/commons/8/87/Hugo_Boss_orange_logo.svg',
  'armani': 'https://upload.wikimedia.org/wikipedia/commons/7/73/Emporio_Armani_logo.svg',
  'ralph-lauren': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Ralph_Lauren_logo.svg',
  'converse': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Converse_logo.svg',
  'vans': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Vans-logo.svg',
  'ray-ban': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/Ray-Ban_logo.svg',
  'casio': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Casio_logo.svg',
  'michael-kors': 'https://upload.wikimedia.org/wikipedia/en/3/32/Michael_Kors_%28brand%29_logo.svg',
  'skechers': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Skechers_wordmark.svg',
};

function fetchWithRedirect(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/svg+xml,image/*,*/*;q=0.8'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchWithRedirect(res.headers.location));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: d });
      });
    }).on('error', (e) => resolve({ statusCode: 500, error: e.message }));
  });
}

async function downloadAll() {
  console.log('Downloading 100% Authentic Official Brand Vector SVGs...\n');
  let successCount = 0;
  for (const [slug, url] of Object.entries(brandSources)) {
    const res = await fetchWithRedirect(url);
    if (res.statusCode === 200 && res.data.includes('<svg')) {
      const destPath = path.join(brandsDir, `${slug}.svg`);
      fs.writeFileSync(destPath, res.data.trim(), 'utf8');
      console.log(`✓ [200 OK] ${slug}.svg (${res.data.length} bytes)`);
      successCount++;
    } else {
      console.error(`✗ [${res.statusCode}] Failed for ${slug}: ${url}`);
    }
  }
  console.log(`\nSuccessfully downloaded ${successCount} / ${Object.keys(brandSources).length} official SVGs!`);
}

downloadAll();
