import type { NextConfig } from 'next';

const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
    ],
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiUrl}/api/:path*` },
      { source: '/uploads/:path*', destination: `${apiUrl}/uploads/:path*` },
    ];
  },
};

export default nextConfig;