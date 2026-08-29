import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '../packages/shared/src/constants/roles';
import {
  createTotpSessionToken,
  strongPasswordSchema,
  verifyTotpSessionToken,
} from '../packages/shared/src/auth';
import {
  generateExchangeQRToken,
  generateLoyaltyQRToken,
  verifyExchangeQRToken,
  verifyLoyaltyQRToken,
} from '../packages/shared/src/utils/qr';
import {
  createAdminPartialAuthToken,
  verifyAdminPartialAuthToken,
} from '../apps/admin/src/lib/admin-2fa';

const userId = '11111111-1111-4111-8111-111111111111';
const authSecret = 'a'.repeat(64);

describe('password policy', () => {
  it('accepts a long mixed password and rejects weak values', () => {
    expect(strongPasswordSchema.safeParse('Secure-passphrase-2026!').success).toBe(true);
    expect(strongPasswordSchema.safeParse('short').success).toBe(false);
    expect(strongPasswordSchema.safeParse('alllowercasebutlong1!').success).toBe(false);
  });
});

describe('TOTP session signing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts a valid signed session and rejects tampering', async () => {
    const token = await createTotpSessionToken({ userId, role: USER_ROLES.ADMIN }, authSecret, 60);
    await expect(verifyTotpSessionToken(token, authSecret)).resolves.toMatchObject({
      userId,
      role: USER_ROLES.ADMIN,
    });
    await expect(verifyTotpSessionToken(`${token.slice(0, -1)}x`, authSecret)).resolves.toBeNull();
    await expect(verifyTotpSessionToken(token, 'b'.repeat(64))).resolves.toBeNull();
  });

  it('rejects an expired signed session', async () => {
    const token = await createTotpSessionToken({ userId, role: USER_ROLES.SUB_ADMIN }, authSecret, 60);
    vi.setSystemTime(new Date('2026-08-05T12:01:01Z'));
    await expect(verifyTotpSessionToken(token, authSecret)).resolves.toBeNull();
  });
});

describe('admin partial authentication token', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-05T12:00:00Z'));
    process.env.EUROSTORE_AUTH_COOKIE_SECRET = authSecret;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.EUROSTORE_AUTH_COOKIE_SECRET;
  });

  it('encrypts session credentials and validates the five-minute token', () => {
    const token = createAdminPartialAuthToken({
      userId,
      role: USER_ROLES.ADMIN,
      accessToken: 'access-secret-value',
      refreshToken: 'refresh-secret-value',
      sessionExpiresAt: 2_000_000_000,
    });

    expect(token).not.toContain('access-secret-value');
    expect(token).not.toContain('refresh-secret-value');
    expect(verifyAdminPartialAuthToken(token)).toMatchObject({ userId, role: USER_ROLES.ADMIN });
  });

  it('rejects tampering and expiration', () => {
    const token = createAdminPartialAuthToken({
      userId,
      role: USER_ROLES.SUB_ADMIN,
      accessToken: 'access',
      refreshToken: 'refresh',
      sessionExpiresAt: null,
    });

    expect(() => verifyAdminPartialAuthToken(`${token.slice(0, -1)}x`)).toThrow();
    vi.setSystemTime(new Date('2026-08-05T12:05:01Z'));
    expect(() => verifyAdminPartialAuthToken(token)).toThrow('partial_token_expired');
  });
});

describe('signed QR tokens', () => {
  it('round-trips exchange claims and rejects the wrong key', () => {
    const token = generateExchangeQRToken(
      { exchangeId: 'exchange-1', customerId: userId },
      'exchange-secret',
      { expiresIn: '5m' },
    );
    expect(verifyExchangeQRToken(token, 'exchange-secret')).toMatchObject({
      exchangeId: 'exchange-1',
      exchange_request_id: 'exchange-1',
      customerId: userId,
      type: 'exchange',
    });
    expect(() => verifyExchangeQRToken(token, 'wrong-secret')).toThrow();
  });

  it('requires signed version-two loyalty claims', () => {
    const token = generateLoyaltyQRToken(userId, 'loyalty-secret');
    expect(verifyLoyaltyQRToken(token, 'loyalty-secret')).toEqual({
      customerId: userId,
      type: 'loyalty',
      version: 2,
      iat: expect.any(Number),
    });
    expect(() => verifyLoyaltyQRToken(token, 'wrong-secret')).toThrow();
  });

  it('fails closed when a QR secret is missing', () => {
    expect(() => generateExchangeQRToken({ exchangeId: 'x', customerId: userId }, '')).toThrow();
    expect(() => generateLoyaltyQRToken(userId, '')).toThrow();
  });
});
