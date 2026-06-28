const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@eurostore/ui', '@eurostore/database', '@eurostore/shared', '@eurostore/config', '@eurostore/adapters'],
  async headers() { return [{ source: '/(.*)', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] }]; }
};
module.exports = withNextIntl(nextConfig);
