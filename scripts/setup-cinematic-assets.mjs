/**
 * setup-cinematic-assets.mjs
 *
 * يحمّل فيديوهات Placeholder لأقسام المتجر (رجالي، نسائي، ولادي)
 * من يوتيوب باستخدام yt-dlp، ثم يقطّعها إلى إطارات باستخدام extract-frames.mjs
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const videosDir = resolve(rootDir, 'apps/web/public/videos');

if (!existsSync(videosDir)) {
  mkdirSync(videosDir, { recursive: true });
}

// 1. تعريف الفيديوهات التي سنحملها كـ Placeholders
const assets = [
  {
    category: 'men',
    searchQuery: 'ytsearch1:"3d men fashion animation short" OR "3d suit animation"',
  },
  {
    category: 'women',
    searchQuery: 'ytsearch1:"3d dress animation short" OR "3d fashion runway animation"',
  },
  {
    category: 'kids',
    searchQuery: 'ytsearch1:"3d kids toy animation" OR "3d cute animation short"',
  },
];

console.log('🎬 بدء تجهيز الأصول السينمائية (Cinematic Assets)...\n');

for (const asset of assets) {
  const videoPath = resolve(videosDir, `${asset.category}.mp4`);
  const framesDir = `apps/web/public/frames/${asset.category}`;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦 جاري معالجة قسم: ${asset.category.toUpperCase()}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (!existsSync(videoPath)) {
    console.log(`\n⬇️  جاري تحميل الفيديو لـ ${asset.category}...`);
    try {
      execSync(`C:\\Users\\Ammar\\AppData\\Local\\Python\\pythoncore-3.14-64\\Scripts\\yt-dlp.exe "${asset.searchQuery}" --no-playlist --max-downloads 1 -f "best[ext=mp4]" --match-filter "duration < 180" -o "${videoPath}"`, {
        cwd: rootDir,
        stdio: 'inherit',
      });
    } catch (err) {
      console.error(`❌ فشل تحميل ${asset.category}. حاول يدوياً.`);
      continue;
    }
  } else {
    console.log(`\n✅ الفيديو موجود مسبقاً: ${videoPath}`);
  }

  console.log(`\n🎞  جاري تقطيع الإطارات لـ ${asset.category}...`);
  try {
    execSync(`node scripts/extract-frames.mjs "apps/web/public/videos/${asset.category}.mp4" "${framesDir}" 100`, {
      cwd: rootDir,
      stdio: 'inherit',
    });
  } catch (err) {
    console.error(`❌ فشل تقطيع الإطارات لـ ${asset.category}.`);
  }
}

console.log(`\n🎉 اكتمل تجهيز جميع الأصول السينمائية!`);
