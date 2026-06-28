const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@eurostore/ui', '@eurostore/database', '@eurostore/shared', '@eurostore/config', '@eurostore/adapters'],
  async headers() {
    return [{ source: '/(.*)', headers: [{ key: 'X-Frame-Options', value: 'DENY' }, { key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] }];
  }
};
module.exports = withNextIntl(nextConfig);
