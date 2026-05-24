
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')();

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,

  // تأكد من ظهور أخطاء TypeScript أثناء البناء لتجنب المشاكل في الإنتاج.
  productionBrowserSourceMaps: false,
  turbopack: {},
  
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
};

module.exports = withPWA(nextConfig);