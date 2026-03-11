import type { Metadata } from "next"
import Link from "next/link"
import { SCHOLARSHIPS, CAT_META } from "@/lib/data"

export const metadata: Metadata = {
  title: "Scholarship Guides & Tips",
  description: "In-depth guides for every major scholarship — eligibility breakdowns, application tips, and insider advice to help you win.",
  alternates: { canonical: "/blog" },
}

// Each scholarship becomes a blog post
// In production you'd store these in a CMS or MDX files
// For now we generate them from the scholarship data
const POSTS = SCHOLARSHIPS.map(s => ({
  slug: s.slug,
  scholarshipId: s.id,
  title: `How to Win the ${s.name}`,
  excerpt: `Everything you need to know about the ${s.name} — eligibility requirements, application tips, and how to stand out. ${s.amount} available.`,
  category: s.category,
  tags: s.tags,
  amount: s.amount,
  deadline: s.deadline,
  url: `/blog/${s.slug}`,
}))

const CATEGORIES = ["all", "scholarship", "grant", "trade", "other"] as const

export default function BlogPage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string }
}) {
  const activeCat = searchParams.cat || "all"
  const query = searchParams.q || ""

  const filtered = POSTS.filter(p => {
    if (activeCat !== "all" && p.category !== activeCat) return false
    if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <>
      {/* Hero */}
      <section className="blog-hero">
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div className="hero-badge">✍️ Scholarship Guides</div>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(30px, 6vw, 50px)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 14,
          }}>
            Win More.<br />Apply Smarter.
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>
            {POSTS.length} in-depth guides — one for every scholarship in our directory.
          </p>
        </div>
      </section>

      <div className="page-wrap">

        {/* Category filter pills */}
        <div className="filter-bar" style={{ marginBottom: 24 }}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={cat === "all" ? "/blog" : `/blog?cat=${cat}`}
              className={`pill${activeCat === cat ? " active" : ""}`}
              style={activeCat === cat && cat !== "all" ? {
                background: CAT_META[cat].color,
                borderColor: "transparent",
                color: "#fff",
              } : {}}
            >
              {cat === "all" ? "✦ All" : `${CAT_META[cat].icon} ${CAT_META[cat].label}`}
            </Link>
          ))}
        </div>

        <div className="results-bar">
          <span className="results-count">
            <strong>{filtered.length}</strong> guides
          </span>
        </div>

        {/* Post list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((post, i) => {
            const meta = CAT_META[post.category]
            return (
              <Link
                key={post.slug}
                href={post.url}
                className="blog-card fade-up"
                style={{ animationDelay: `${Math.min(i, 20) * 0.025}s` }}
              >
                <div className="blog-card-meta">
                  <span className="card-cat" style={{ color: meta.color, background: `${meta.color}14`, padding: "3px 10px", borderRadius: 100, fontSize: 11 }}>
                    {meta.icon} {meta.label}
                  </span>
                  {post.deadline && (
                    <span style={{ fontSize: 12, color: "#8a9abb", fontWeight: 500 }}>📅 {post.deadline}</span>
                  )}
                  {post.tags.slice(0, 2).map(t => (
                    <span key={t} className="tag-chip">{t}</span>
                  ))}
                </div>
                <div className="blog-card-title">{post.title}</div>
                <p className="blog-card-excerpt">{post.excerpt}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: meta.color }}>{post.amount}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a3a6b" }}>Read guide →</span>
                </div>
              </Link>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">📝</div>
            <div className="empty-text">No posts match that filter.</div>
          </div>
        )}
      </div>
    </>
  )
}
