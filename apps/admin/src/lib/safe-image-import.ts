import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { hasExpectedFileSignature } from '@eurostore/shared';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export class ImageImportError extends Error {
  constructor(public readonly code: string, public readonly status = 422) {
    super(code);
  }
}

function isBlockedIpv4(address: string) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224;
}

function isBlockedIp(address: string) {
  const version = isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version !== 6) return true;

  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) {
    const mappedIpv4 = normalized.slice('::ffff:'.length);
    return isIP(mappedIpv4) !== 4 || isBlockedIpv4(mappedIpv4);
  }
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || /^fe[89ab]/.test(normalized);
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
    throw new ImageImportError('invalid_image_url');
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new ImageImportError('private_image_url');
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true }).catch(() => []);
  if (!addresses.length || addresses.some(({ address }) => isBlockedIp(address))) {
    throw new ImageImportError('private_image_url');
  }
}

async function readLimitedBody(response: Response) {
  const declaredLength = Number(response.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES) throw new ImageImportError('image_too_large');
  if (!response.body) throw new ImageImportError('empty_image_response');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  let readResult = await reader.read();
  while (!readResult.done) {
    const { value } = readResult;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new ImageImportError('image_too_large');
    }
    chunks.push(value);
    readResult = await reader.read();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function fetchPublicImage(rawUrl: string) {
  let current = new URL(rawUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await assertPublicUrl(current);
    const response = await fetch(current, {
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'image/jpeg,image/png,image/webp,image/avif' },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirectCount === MAX_REDIRECTS) throw new ImageImportError('too_many_redirects');
      current = new URL(location, current);
      continue;
    }

    if (!response.ok) throw new ImageImportError('url_fetch_failed');
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
    if (!ALLOWED_TYPES.has(contentType)) throw new ImageImportError('unsupported_image_type');

    const bytes = await readLimitedBody(response);
    if (!(await hasExpectedFileSignature(new Blob([bytes]), contentType))) {
      throw new ImageImportError('image_signature_mismatch');
    }
    return { bytes, contentType, sourceUrl: current.toString() };
  }

  throw new ImageImportError('url_fetch_failed');
}
