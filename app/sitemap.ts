import { MetadataRoute } from "next"
import { SCHOLARSHIPS, LOCAL_DATA } from "@/lib/data"
import { SITE_URL } from "@/lib/utils"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/scholarships`, lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/local`,   lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${SITE_URL}/blog`,    lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${SITE_URL}/about`,   lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ]

  const scholarshipPages: MetadataRoute.Sitemap = SCHOLARSHIPS.map(s => ({
    url: `${SITE_URL}/scholarships/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const blogPages: MetadataRoute.Sitemap = SCHOLARSHIPS.map(s => ({
    url: `${SITE_URL}/blog/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const localPages: MetadataRoute.Sitemap = LOCAL_DATA.map(s => ({
    url: `${SITE_URL}/local/${s.state.toLowerCase()}/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }))

  return [...staticPages, ...scholarshipPages, ...blogPages, ...localPages]
}
