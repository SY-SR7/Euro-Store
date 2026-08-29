import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createPrivateStorageUrlMap,
  getPrivateStoragePath,
} from '../packages/database/src/private-storage';
import { getSupabasePublicEnv, getSupabaseServiceEnv } from '../packages/database/src/env';
import { hasExpectedFileSignature } from '../packages/shared/src/file-signatures';
import { buildAppUrl, getServerRuntimeConfig } from '../packages/shared/src/runtime-config';

describe('private storage paths', () => {
  it('extracts valid object keys from stored values and legacy URLs', () => {
    expect(getPrivateStoragePath('exchange-images/customer/item.jpg', 'exchange-images')).toBe('customer/item.jpg');
    expect(getPrivateStoragePath(
      'https://project.supabase.co/storage/v1/object/sign/exchange-images/customer%2Fitem.jpg?token=x',
      'exchange-images',
    )).toBe('customer/item.jpg');
  });

  it.each([
    'exchange-images/../secret.txt',
    'exchange-images/folder//item.jpg',
    'exchange-images/folder\\item.jpg',
    'https://project.supabase.co/storage/v1/object/public/other-bucket/item.jpg',
  ])('rejects unsafe or unrelated storage value %s', (value) => {
    expect(getPrivateStoragePath(value, 'exchange-images')).toBeNull();
  });

  it('signs each unique safe object and maps it back to the stored value', async () => {
    const calls: unknown[] = [];
    const client = {
      storage: {
        from: (bucket: string) => ({
          createSignedUrls: async (paths: string[], expiresIn: number) => {
            calls.push({ bucket, paths, expiresIn });
            return {
              data: paths.map((path) => ({ path, signedUrl: `https://signed.test/${path}` })),
              error: null,
            };
          },
        }),
      },
    };

    const result = await createPrivateStorageUrlMap(client, 'exchange-images', [
      'exchange-images/a.jpg',
      'exchange-images/a.jpg',
      'exchange-images/../blocked.jpg',
    ]);

    expect(calls).toEqual([{ bucket: 'exchange-images', paths: ['a.jpg'], expiresIn: 300 }]);
    expect(result.get('exchange-images/a.jpg')).toBe('https://signed.test/a.jpg');
    expect(result.has('exchange-images/../blocked.jpg')).toBe(false);
  });
});

describe('environment configuration', () => {
  const publicEnv = {
    EUROSTORE_DATABASE_PROVIDER: 'supabase',
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  };

  it('requires an explicit supported database provider', () => {
    expect(getSupabasePublicEnv(publicEnv)).toEqual({
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'anon-key',
    });
    expect(() => getSupabasePublicEnv({ ...publicEnv, EUROSTORE_DATABASE_PROVIDER: 'unknown' })).toThrow();
    expect(() => getSupabasePublicEnv({ EUROSTORE_DATABASE_PROVIDER: 'supabase' })).toThrow();
  });

  it('requires the service role only on the server', () => {
    expect(getSupabaseServiceEnv({ ...publicEnv, SUPABASE_SERVICE_ROLE_KEY: 'service-key' })).toMatchObject({
      supabaseServiceRoleKey: 'service-key',
    });
  });

  it('parses provider configuration and prevents external path override', () => {
    const env = {
      EUROSTORE_DEPLOYMENT_PROVIDER: 'vercel',
      EUROSTORE_DATABASE_PROVIDER: 'supabase',
      EUROSTORE_AUTH_PROVIDER: 'supabase',
      EUROSTORE_STORAGE_PROVIDER: 'supabase',
      EUROSTORE_EMAIL_PROVIDER: 'resend',
      EUROSTORE_PAYMENT_PROVIDER: 'cash_on_delivery_only',
      NEXT_PUBLIC_APP_URL: 'https://shop.eurostore.test',
      NEXT_PUBLIC_ADMIN_URL: 'https://admin.eurostore.test',
      NEXT_PUBLIC_HELPER_URL: 'https://helper.eurostore.test',
      NEXT_PUBLIC_PARTNER_URL: 'https://partner.eurostore.test',
    };

    expect(getServerRuntimeConfig(env).providers.payment).toBe('cash_on_delivery_only');
    expect(buildAppUrl('admin', '/orders/1?tab=items', env)).toBe('https://admin.eurostore.test/orders/1?tab=items');
    expect(buildAppUrl('admin', 'https://evil.test/steal', env)).toBe('https://admin.eurostore.test/');
  });
});

describe('PWA assets', () => {
  it('ships every icon referenced by the web manifest', () => {
    const root = resolve(import.meta.dirname, '..', 'apps/web/public/icons');
    expect(existsSync(resolve(root, 'icon-192x192.png'))).toBe(true);
    expect(existsSync(resolve(root, 'icon-512x512.png'))).toBe(true);
    expect(existsSync(resolve(root, 'maskable-icon.png'))).toBe(true);
  });
});

describe('file signatures', () => {
  it('accepts matching image signatures and rejects MIME spoofing', async () => {
    const png = new Blob([
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]),
    ], { type: 'image/png' });
    const spoofed = new Blob([Uint8Array.from([0x3c, 0x73, 0x76, 0x67])], { type: 'image/png' });

    await expect(hasExpectedFileSignature(png)).resolves.toBe(true);
    await expect(hasExpectedFileSignature(spoofed)).resolves.toBe(false);
    await expect(hasExpectedFileSignature(png, 'image/svg+xml')).resolves.toBe(false);
  });
});
