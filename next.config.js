/** @type {import('next').NextConfig} */
const fs = require('fs')
const path = require('path')

function getTradeRedirects() {
  const dataPath = path.join(__dirname, 'lib', 'data.ts')
  const src = fs.readFileSync(dataPath, 'utf8')

  // Extract RAW_SCHOLARSHIPS block
  const rawMatch = src.match(/const RAW_SCHOLARSHIPS[^=]*=\s*\[([\s\S]*?)\] as const/)
  if (!rawMatch) return []

  const block = rawMatch[1]
  const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Find all trade entries: { id:N, name:"...", category:"trade", ... }
  const tradeRe = /\{\s*id\s*:\s*(\d+)\s*,\s*name\s*:\s*"([^"]+)"\s*,\s*[^}]*category\s*:\s*"trade"/g
  const trades = []
  let m
  while ((m = tradeRe.exec(block)) !== null) {
    trades.push({ id: parseInt(m[1]), name: m[2] })
  }

  // Replicate slug deduplication logic from data.ts
  const bases = trades.map(t => slugify(t.name))
  const counts = {}
  for (const b of bases) counts[b] = (counts[b] || 0) + 1

  return trades.map((t, i) => {
    const slug = counts[bases[i]] > 1 ? `${bases[i]}-${t.id}` : bases[i]
    return {
      source: `/scholarships/${slug}`,
      destination: `/trades/${slug}`,
      permanent: true,
    }
  })
}

const nextConfig = {
  optimizeFonts: false,
  async redirects() {
    const tradeRedirects = getTradeRedirects()
    return [
      {
        source: '/(.*)',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://localscholarships.org/:path*',
        permanent: true,
      },
      ...tradeRedirects,
    ]
  },
  async headers() {
    const isPreview = process.env.VERCEL_ENV !== 'production'
    if (!isPreview) return []
    return [{
      source: '/(.*)',
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
    }]
  }
}
module.exports = nextConfig
