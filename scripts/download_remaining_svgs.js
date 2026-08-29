const https = require('https');
const fs = require('fs');
const path = require('path');

const brandsDir = path.join(__dirname, '../apps/web/public/brands');

const remainingSources = {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchWithRedirect(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'EuroStoreCatalogBot/3.0 (info@eurostore.sy; https://eurostore.sy)',
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

async function downloadRemaining() {
  console.log('Downloading remaining 10 official brand SVGs with rate limit pacing...\n');
  for (const [slug, url] of Object.entries(remainingSources)) {
    await sleep(1500); // 1.5s delay to prevent 429
    const res = await fetchWithRedirect(url);
    if (res.statusCode === 200 && res.data.includes('<svg')) {
      const destPath = path.join(brandsDir, `${slug}.svg`);
      fs.writeFileSync(destPath, res.data.trim(), 'utf8');
      console.log(`✓ [200 OK] ${slug}.svg (${res.data.length} bytes)`);
    } else {
      console.error(`✗ [${res.statusCode}] Failed for ${slug}: ${url}`);
    }
  }
}

downloadRemaining();
