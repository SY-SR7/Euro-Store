import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createContentSecurityPolicy,
  isAllowedMutationOrigin,
  safeInternalPath,
} from '../packages/shared/src/security';

function request(
  method: string,
  headers: Record<string, string> = {},
  url = 'https://admin.eurostore.test/api/orders',
) {
  return new Request(url, { method, headers });
}

describe('safeInternalPath', () => {
  it('keeps internal paths including query and hash', () => {
    expect(safeInternalPath('/orders/123?tab=items#summary')).toBe('/orders/123?tab=items#summary');
  });

  it.each([
    'https://evil.test/steal',
    '//evil.test/steal',
    '/\\evil.test/steal',
    'javascript:alert(1)',
    '',
  ])('rejects unsafe redirect value %s', (value) => {
    expect(safeInternalPath(value, '/account')).toBe('/account');
  });
});

describe('isAllowedMutationOrigin', () => {
  it('allows safe methods without origin headers', () => {
    expect(isAllowedMutationOrigin(request('GET'))).toBe(true);
    expect(isAllowedMutationOrigin(request('HEAD'))).toBe(true);
  });

  it('allows same-origin writes', () => {
    expect(isAllowedMutationOrigin(request('POST', { origin: 'https://admin.eurostore.test' }))).toBe(true);
  });

  it('rejects cross-site writes and origin lookalikes', () => {
    expect(isAllowedMutationOrigin(request('POST', {
      origin: 'https://admin.eurostore.test.evil.test',
      'sec-fetch-site': 'cross-site',
    }))).toBe(false);
  });

  it('allows explicit trusted origins by exact origin only', () => {
    const trusted = ['https://web.eurostore.test'];
    expect(isAllowedMutationOrigin(
      request('POST', { origin: 'https://web.eurostore.test' }),
      trusted,
    )).toBe(true);
    expect(isAllowedMutationOrigin(
      request('POST', { origin: 'https://web.eurostore.test.evil.test' }),
      trusted,
    )).toBe(false);
  });

  it('allows non-cookie bearer clients and rejects ambiguous cookie writes without origin', () => {
    expect(isAllowedMutationOrigin(request('POST', { authorization: 'Bearer test-token' }))).toBe(true);
    expect(isAllowedMutationOrigin(request('POST', {
      authorization: 'Bearer test-token',
      cookie: 'session=value',
    }))).toBe(false);
  });
});

describe('content security policy', () => {
  it('uses a nonce and restrictive production directives', () => {
    const policy = createContentSecurityPolicy('admin', 'nonce-value');
    expect(policy).toContain("script-src 'self' 'nonce-nonce-value' 'strict-dynamic'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain('upgrade-insecure-requests');
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it('adds only the development script exception when requested', () => {
    const policy = createContentSecurityPolicy('web', 'dev-nonce', true);
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).not.toContain('upgrade-insecure-requests');
  });
});

describe('mobile session storage', () => {
  it('keeps Supabase session tokens in the platform secure store', () => {
    const source = readFileSync(resolve(import.meta.dirname, '../apps/mobile/utils/supabase.ts'), 'utf8');
    expect(source).toContain("from 'expo-secure-store'");
    expect(source).not.toContain("from '@react-native-async-storage/async-storage'");
    const pushSource = readFileSync(resolve(import.meta.dirname, '../apps/mobile/utils/pushNotifications.ts'), 'utf8');
    expect(pushSource).toContain("from 'expo-secure-store'");
    expect(pushSource).not.toContain("from '@react-native-async-storage/async-storage'");
  });
});
