
/** @type {import('next').NextConfig} */
// const withPWA = require('next-pwa')({
//   disable: process.env.NODE_ENV === 'development',
// });

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,

  // تأكد من ظهور أخطاء TypeScript أثناء البناء لتجنب المشاكل في الإنتاج.
  productionBrowserSourceMaps: false,
  
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  
  // Compression and optimization
  compress: true,
  
  // Images optimization
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      minimize: true,
      usedExports: true,
      sideEffects: false,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for external dependencies
          vendor: {
            filename: 'chunks/vendor.js',
            test: /node_modules/,
            name: 'vendor',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Common chunk for shared code
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            name: 'common',
          },
        },
      },
    };
    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_CREATE_PRODUCT_FUNCTION_URL: process.env.NEXT_PUBLIC_SUPABASE_CREATE_PRODUCT_FUNCTION_URL,
    NEXT_PUBLIC_SUPABASE_CREATE_SECTION_FUNCTION_URL: process.env.NEXT_PUBLIC_SUPABASE_CREATE_SECTION_FUNCTION_URL,
    NEXT_PUBLIC_SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL: process.env.NEXT_PUBLIC_SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL,
    NEXT_PUBLIC_SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL: process.env.NEXT_PUBLIC_SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  },

  output: 'export',

  // Export tracing for smaller builds
  turbopack: {},
  experimental: {},
};

module.exports = nextConfig;