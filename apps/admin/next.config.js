const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: [
    '@eurostore/ui',
    '@eurostore/database',
    '@eurostore/shared',
    '@eurostore/config',
    '@eurostore/adapters'
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              // Dev: allow unsafe-eval for Next.js HMR and webpack
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws: https://*.supabase.co wss://*.supabase.co; font-src 'self' data:;"
              // Prod: strict CSP — no unsafe-eval
              : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https: wss: https://*.supabase.co wss://*.supabase.co; font-src 'self' data:;"
          }
        ]
      }
    ];
  }
};

module.exports = withNextIntl(nextConfig);