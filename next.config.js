
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')();

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  
  // تسريع البناء عبر تجاهل الأخطاء غير الحرجة وقت الـ Build
  typescript: { ignoreBuildErrors: true },
  
  // تحسين استهلاك الذاكرة
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
  },
  output: 'export',
};

module.exports = withPWA(nextConfig);