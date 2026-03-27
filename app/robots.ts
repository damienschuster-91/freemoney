import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production'
  return {
    rules: isProduction
      ? { userAgent: '*', allow: '/', disallow: ['/cms'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: 'https://localscholarships.org/sitemap.xml',
  }
}
