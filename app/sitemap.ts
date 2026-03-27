import { MetadataRoute } from "next"
import { SCHOLARSHIPS, LOCAL_DATA, ALL_TAGS } from "@/lib/data"
import { getAllPosts } from "@/lib/blog"
import { SITE_URL } from "@/lib/utils"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                   lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/scholarships`, lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/local`,        lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${SITE_URL}/trades`,       lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${SITE_URL}/blog`,         lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${SITE_URL}/about`,        lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ]

  const scholarshipPages: MetadataRoute.Sitemap = SCHOLARSHIPS.map(s => ({
    url: `${SITE_URL}/scholarships/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  const tagPages: MetadataRoute.Sitemap = ALL_TAGS.map(tag => ({
    url: `${SITE_URL}/scholarships/tag/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }))

  const uniqueStates = LOCAL_DATA.map(s => s.state.toLowerCase())
    .filter((s, i, arr) => arr.indexOf(s) === i)

  const statePages: MetadataRoute.Sitemap = uniqueStates.map(state => ({
    url: `${SITE_URL}/local/${state}`,
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

  function citySlug(city: string) {
    return city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  }
  const seenCities = new Set<string>()
  const cityPages: MetadataRoute.Sitemap = LOCAL_DATA.flatMap(s => {
    const key = `${s.state.toLowerCase()}-${citySlug(s.city)}`
    if (seenCities.has(key)) return []
    seenCities.add(key)
    return [{
      url: `${SITE_URL}/local/${s.state.toLowerCase()}/${citySlug(s.city)}-scholarships`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    }]
  })

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map(p => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.reviewed ? new Date(p.reviewed) : p.date ? new Date(p.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...scholarshipPages,
    ...tagPages,
    ...statePages,
    ...localPages,
    ...cityPages,
    ...blogPages,
  ]
}
