import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'revendaclick.com.br' },
      { protocol: 'https', hostname: 'www.revendaclick.com.br' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Cache public store pages at CDN for 60s, stale-while-revalidate 300s
        source: '/:slug((?!dashboard|vehicles|leads|settings|login|api|_next).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ]
  },
}

export default nextConfig
