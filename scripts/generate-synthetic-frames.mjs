/**
 * generate-synthetic-frames.mjs
 * 
 * Takes a static image and generates 100 frames of a slow zoom/pan effect
 * using ffmpeg's zoompan filter.
 */

import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const [, , imagePath, outputDir, frameCountArg] = process.argv;
const frameCount = parseInt(frameCountArg ?? '100', 10);

if (!imagePath || !outputDir) {
  console.error('Usage: node scripts/generate-synthetic-frames.mjs <image> <outputDir> [frameCount]');
  process.exit(1);
}

const absImage = resolve(rootDir, imagePath);
const absOutput = resolve(rootDir, outputDir);

if (!existsSync(absImage)) {
  console.error(`❌ Image not found: ${absImage}`);
  process.exit(1);
}

if (!existsSync(absOutput)) {
  mkdirSync(absOutput, { recursive: true });
}

console.log(`🎬 Generating ${frameCount} synthetic frames from ${absImage}...`);

// Use ffmpeg zoompan to zoom in slowly over `frameCount` frames
// We will pad the 1024x1024 image to 1920x1080 with black background, then zoom it.
// This ensures that when the canvas uses object-fit: cover on a 16:9 desktop monitor,
// it perfectly fits without cropping the top/bottom (which chopped the heads off previously).
// On mobile, the sides (black bars) will be cropped, leaving the center 1024x1024.
const ffmpegPath = ffmpegInstaller.path;
const cmd = `"${ffmpegPath}" -y -loop 1 -i "${absImage}" -vf "pad=1920:1080:-1:-1:color=black, zoompan=z='min(zoom+0.002,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frameCount}:s=1920x1080" -vframes ${frameCount} -q:v 3 "${absOutput}/frame_%04d.jpg"`;

try {
  execSync(cmd, { stdio: 'inherit', cwd: rootDir });
  console.log(`✅ Success! Frames saved to ${absOutput}`);
} catch (e) {
  console.error(`❌ Failed to generate frames.`, e.message);
}
