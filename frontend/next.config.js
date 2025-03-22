/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Enables standalone mode
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true, // Improves build performance
};

module.exports = nextConfig;