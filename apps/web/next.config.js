const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../..'),
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/orders/*/invoice': ['../../packages/database/assets/NotoSansArabic.ttf'],
  },
  transpilePackages: [
    '@eurostore/ui',
    '@eurostore/database',
    '@eurostore/shared',
    '@eurostore/config',
    '@eurostore/adapters'
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'm.media-amazon.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.amazon.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.amazon.de', pathname: '/**' },
    ],
  },
  async headers() {
    const developmentMobileCors = process.env.NODE_ENV === 'development'
      ? [{
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: 'http://localhost:8081' },
            { key: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' },
            { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, PUT, DELETE, OPTIONS' },
          ],
        }]
      : [];

    return [
      ...developmentMobileCors,
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};

module.exports = withNextIntl(nextConfig);
