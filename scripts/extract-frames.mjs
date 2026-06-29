/**
 * extract-frames.mjs
 *
 * يقطّع أي فيديو إلى تسلسل صور (Image Sequence) باستخدام Web API في Node.js.
 * الاستخدام:
 *   node scripts/extract-frames.mjs <مسار-الفيديو> <مجلد-الخرج> <عدد-الإطارات>
 *
 * مثال:
 *   node scripts/extract-frames.mjs public/videos/shoes-intro.mp4 public/frames/shoes 120
 *
 * المتطلبات:
 *   pnpm add -D @ffmpeg/ffmpeg @ffmpeg/util
 */

import { createWriteStream, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const [, , videoPath, outputDir, frameCountArg] = process.argv;
const frameCount = parseInt(frameCountArg ?? '120', 10);

if (!videoPath || !outputDir) {
  console.error('Usage: node scripts/extract-frames.mjs <video> <outputDir> [frameCount]');
  process.exit(1);
}

const absVideo  = resolve(process.cwd(), videoPath);
const absOutput = resolve(process.cwd(), outputDir);

if (!existsSync(absOutput)) {
  mkdirSync(absOutput, { recursive: true });
}

console.log(`\n📽  EuroStore Frame Extractor`);
console.log(`   Video:      ${absVideo}`);
console.log(`   Output dir: ${absOutput}`);
console.log(`   Frames:     ${frameCount}`);
console.log(`\n   جار التحميل...\n`);

let FFmpeg;
let fetchFile;

try {
  const ffmpegModule = await import('@ffmpeg/ffmpeg');
  const utilModule   = await import('@ffmpeg/util');
  FFmpeg    = ffmpegModule.FFmpeg;
  fetchFile = utilModule.fetchFile;
} catch {
  console.error('\n❌  @ffmpeg/ffmpeg غير مثبت. قم بتشغيل:\n');
  console.error('   pnpm add -D @ffmpeg/ffmpeg @ffmpeg/util\n');
  process.exit(1);
}

const ffmpeg = new FFmpeg();
await ffmpeg.load();

// Write video to ffmpeg virtual fs
const videoData = await fetchFile(absVideo);
await ffmpeg.writeFile('input.mp4', videoData);

// Get duration via ffprobe-like exec
// ffmpeg will report duration in stderr — we'll use a fixed fps approach
// Extract exactly `frameCount` frames spread evenly
await ffmpeg.exec([
  '-i', 'input.mp4',
  '-vf', `select='not(mod(n,1))',fps=${frameCount}/$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 input.mp4)`,
  '-vframes', String(frameCount),
  '-q:v', '3',              // JPEG quality 1-31 (3 = high quality)
  '-f', 'image2',
  'frame_%04d.jpg',
]);

// Read and write frames to disk
for (let i = 1; i <= frameCount; i++) {
  const name = `frame_${String(i).padStart(4, '0')}.jpg`;
  try {
    const data = await ffmpeg.readFile(name);
    const outPath = resolve(absOutput, name);
    const ws = createWriteStream(outPath);
    ws.write(data);
    ws.end();
    process.stdout.write(`\r   ✅ ${i}/${frameCount} إطار`);
  } catch {
    // Frame might not exist if video is shorter
    break;
  }
}

console.log(`\n\n🎉  تم! الصور محفوظة في: ${absOutput}\n`);
console.log(`   استخدمها في المكون:`);
console.log(`   frameSrc={(i) => \`/frames/shoes/frame_\${String(i + 1).padStart(4, '0')}.jpg\`}`);
console.log(`   frameCount={${frameCount}}\n`);
