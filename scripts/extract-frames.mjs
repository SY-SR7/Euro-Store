/**
 * extract-frames.mjs
 *
 * يقطّع أي فيديو إلى تسلسل صور (Image Sequence) باستخدام fluent-ffmpeg.
 *
 * الاستخدام:
 *   node scripts/extract-frames.mjs <مسار-الفيديو> <مجلد-الخرج> <عدد-الإطارات>
 *
 * مثال:
 *   pnpm extract-frames public/videos/shoes-intro.mp4 apps/web/public/frames/shoes 120
 */

import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use bundled binaries — no system ffmpeg/ffprobe needed
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const [, , videoPath, outputDir, frameCountArg] = process.argv;
const frameCount = parseInt(frameCountArg ?? '120', 10);

if (!videoPath || !outputDir) {
  console.error('الاستخدام: node scripts/extract-frames.mjs <video> <outputDir> [frameCount]');
  process.exit(1);
}

const absVideo  = resolve(process.cwd(), videoPath);
const absOutput = resolve(process.cwd(), outputDir);

if (!existsSync(absVideo)) {
  console.error(`\n❌  الفيديو غير موجود: ${absVideo}`);
  process.exit(1);
}

if (!existsSync(absOutput)) {
  mkdirSync(absOutput, { recursive: true });
  console.log(`📁  تم إنشاء المجلد: ${absOutput}`);
}

console.log(`\n📽  EuroStore Frame Extractor`);
console.log(`   الفيديو:       ${absVideo}`);
console.log(`   مجلد الخرج:   ${absOutput}`);
console.log(`   عدد الإطارات: ${frameCount}`);
console.log(`   ffmpeg:        ${ffmpegInstaller.path}`);
console.log(`\n   ⏳  جار الاستخراج...\n`);

// Get video duration first
const duration = await new Promise((resolve, reject) => {
  ffmpeg.ffprobe(absVideo, (err, metadata) => {
    if (err) reject(err);
    else resolve(metadata.format.duration);
  });
});

console.log(`   ⏱  مدة الفيديو: ${Math.round(duration)} ثانية`);

// Calculate fps to get exactly `frameCount` frames
const fps = frameCount / duration;

await new Promise((resolve, reject) => {
  let lastPercent = -1;

  ffmpeg(absVideo)
    .outputOptions([
      `-vf fps=${fps.toFixed(4)}`,      // evenly spread frames
      '-q:v 3',                          // JPEG quality (1=best, 31=worst; 3 = high quality ~92%)
      '-vframes', String(frameCount),
    ])
    .output(`${absOutput}/frame_%04d.jpg`)
    .on('progress', (info) => {
      const percent = Math.min(100, Math.round(info.percent ?? 0));
      if (percent !== lastPercent) {
        lastPercent = percent;
        const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
        process.stdout.write(`\r   [${bar}] ${percent}%  `);
      }
    })
    .on('end', resolve)
    .on('error', reject)
    .run();
});

// Count actual files created
const files = readdirSync(absOutput).filter(f => f.endsWith('.jpg'));

console.log(`\n\n🎉  تم! ${files.length} إطار محفوظ في:\n   ${absOutput}\n`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`✅  الخطوة التالية: في ملف apps/web/src/app/(main)/page.tsx`);
console.log(`   غيّر هذا السطر:`);
console.log(`   const FRAMES_READY = false;`);
console.log(`   إلى:`);
console.log(`   const FRAMES_READY = true;`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
