import { authenticator } from 'otplib';
import { z } from 'zod';
import { USER_ROLES, type UserRole } from './constants/roles';

export type StaffRole =
  | typeof USER_ROLES.ADMIN
  | typeof USER_ROLES.SUB_ADMIN
  | typeof USER_ROLES.HELPER
  | typeof USER_ROLES.PARTNER;
export type AdminPortalRole = typeof USER_ROLES.ADMIN | typeof USER_ROLES.SUB_ADMIN;

export const ADMIN_PORTAL_ROLES = [USER_ROLES.ADMIN, USER_ROLES.SUB_ADMIN] as const;
export const ADMIN_TOTP_COOKIE_NAME = 'eurostore_admin_totp';

const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export const registerCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(6).max(32).optional().or(z.literal('')),
  password: passwordSchema,
  preferredLanguage: z.enum(['ar', 'en']).default('ar'),
});

export const totpCodeSchema = z.object({
  code: z.string().trim().regex(/^[0-9]{6}$/),
});

const totpPayloadSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.SUB_ADMIN]),
  issuedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
});

export type TotpSessionPayload = z.infer<typeof totpPayloadSchema>;

authenticator.options = {
  step: 30,
  window: 1,
};

export function getFormString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === 'string' ? value : undefined;
}

export function isAdminPortalRole(role: UserRole): role is AdminPortalRole {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.SUB_ADMIN;
}

export function isStaffRole(role: UserRole): role is StaffRole {
  return role !== USER_ROLES.CUSTOMER;
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function buildTotpUri(accountName: string, issuer: string, secret: string): string {
  return authenticator.keyuri(accountName, issuer, secret);
}

export function verifyTotpCode(secret: string, code: string): boolean {
  return authenticator.check(code, secret);
}

function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API is required for TOTP session signing.');
  }

  return globalThis.crypto;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return getCrypto().subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await getCrypto().subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createTotpSessionToken(
  input: Pick<TotpSessionPayload, 'userId' | 'role'>,
  secret: string,
  ttlSeconds: number
): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = totpPayloadSchema.parse({
    ...input,
    issuedAt,
    expiresAt: issuedAt + ttlSeconds,
  });
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifyTotpSessionToken(token: string, secret: string): Promise<TotpSessionPayload | null> {
  const [encodedPayload, signature, extra] = token.split('.');

  if (!encodedPayload || !signature || extra) {
    return null;
  }

  const expectedSignature = await signPayload(encodedPayload, secret);

  if (signature !== expectedSignature) {
    return null;
  }

  const json = new TextDecoder().decode(base64UrlToBytes(encodedPayload));
  const parsed = totpPayloadSchema.safeParse(JSON.parse(json) as unknown);

  if (!parsed.success || parsed.data.expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return parsed.data;
}
