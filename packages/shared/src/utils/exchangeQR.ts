/**
 * Exchange QR token helpers (HS256 JWT, 72-hour TTL).
 * Secret: EXCHANGE_QR_SECRET env var (min 32 chars).
 */
import crypto from 'crypto';

const ALG = 'sha256';
const TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

interface ExchangeQRPayload {
  exchangeRequestId: string;
  customerId        : string;
  iat               : number;
  exp               : number;
}

function getSecret(): string {
  const s = process.env['EXCHANGE_QR_SECRET'] ?? '';
  if (s.length < 32) throw new Error('EXCHANGE_QR_SECRET must be at least 32 characters');
  return s;
}

function sign(header: string, payload: string, secret: string): string {
  const data = `${header}.${payload}`;
  return crypto.createHmac(ALG, secret).update(data).digest('base64url');
}

export function generateExchangeQRToken(exchangeRequestId: string, customerId: string): string {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now     = Date.now();
  const payload = Buffer.from(JSON.stringify({
    exchangeRequestId,
    customerId,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + TTL_MS) / 1000),
  } satisfies ExchangeQRPayload)).toString('base64url');

  const signature = sign(header, payload, getSecret());
  return `${header}.${payload}.${signature}`;
}

export function verifyExchangeQRToken(token: string): ExchangeQRPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [header, payload, sig] = parts as [string, string, string];

  const expected = sign(header, payload, getSecret());
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    throw new Error('Invalid token signature');

  const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as ExchangeQRPayload;
  if (data.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return data;
}