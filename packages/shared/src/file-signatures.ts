const signatures: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/jpeg': (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/png': (bytes) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value),
  'image/webp': (bytes) => text(bytes, 0, 4) === 'RIFF' && text(bytes, 8, 12) === 'WEBP',
  'image/avif': (bytes) => text(bytes, 4, 8) === 'ftyp' && ['avif', 'avis', 'mif1'].includes(text(bytes, 8, 12)),
  'video/mp4': (bytes) => text(bytes, 4, 8) === 'ftyp',
};

function text(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

export async function hasExpectedFileSignature(file: Blob, mimeType = file.type) {
  const validator = signatures[mimeType.toLowerCase()];
  if (!validator) return false;
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return validator(bytes);
}

