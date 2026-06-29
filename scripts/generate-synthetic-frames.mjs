/**
 * generate-synthetic-frames.mjs
 * 
 * Takes a static image and generates 100 frames of a slow zoom/pan effect
 * using ffmpeg's zoompan filter.
 */

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
// z='zoom+0.002' increases zoom by 0.002 each frame
// s=1024x1024 (or whatever matches the image aspect ratio, let's just use 1920x1080)
// We will use 1080x1920 since this is portrait/vertical scroll usually, or square 1024x1024
const cmd = `npx -p @ffmpeg-installer/ffmpeg -c "ffmpeg -y -loop 1 -i \\"${absImage}\\" -vf \\"zoompan=z='min(zoom+0.002,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frameCount}:s=1024x1024\\" -vframes ${frameCount} -q:v 3 \\"${absOutput}/frame_%04d.jpg\\""`;

try {
  execSync(cmd, { stdio: 'inherit', cwd: rootDir });
  console.log(`✅ Success! Frames saved to ${absOutput}`);
} catch (e) {
  console.error(`❌ Failed to generate frames.`, e.message);
}
