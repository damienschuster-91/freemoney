/** @type {import('next').NextConfig} */
const nextConfig = {
  optimizeFonts: false,
  async redirects() {
    return [{
      source: '/(.*)',
      has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
      destination: 'https://localscholarships.org/:path*',
      permanent: true,
    }]
  },
  async headers() {
    const isVercelPreview = process.env.VERCEL_URL?.includes('vercel.app')
    if (!isVercelPreview) return []
    return [{
      source: '/(.*)',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
    }]
  }
}
module.exports = nextConfig
