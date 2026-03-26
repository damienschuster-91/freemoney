import type { Metadata } from "next"
import Link from "next/link"
import { SCHOLARSHIPS } from "@/lib/data"
import { getAllPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Scholarship Guides & Tips",
  description: "How-to guides for winning scholarships, understanding deadlines, and finding local awards with less competition.",
  alternates: { canonical: "/blog" },
}

export default function BlogPage() {
  const realPosts = getAllPosts()
  const autoGuides = SCHOLARSHIPS.slice(0, 12)
  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"48px 20px" }}>
        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:900, color:"#0d1f3c", marginBottom:8, letterSpacing:"-0.02em" }}>Scholarship Guides</h1>
        <p style={{ color:"#64748b", fontSize:17, marginBottom:48, lineHeight:1.65 }}>Strategy, tips, and deep-dives on winning scholarships and finding local money.</p>
        {realPosts.length > 0 && (
          <div style={{ marginBottom:56 }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:"#0d1f3c", marginBottom:20 }}>Latest Posts</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {realPosts.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
                  <div className="blog-card-meta">
                    <span>{post.date}</span>
                    <span className="sep">·</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">{post.description}</p>
                  {post.tags.length > 0 && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {post.tags.map(t => (
                        <span key={t} className="tag-chip">{t}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:"#0d1f3c", marginBottom:20 }}>Scholarship Guides</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:16 }}>
            {autoGuides.map(s => (
              <Link key={s.id} href={`/blog/${s.slug}`} style={{ textDecoration:"none" }}>
                <div style={{ background:"white", borderRadius:14, border:"1px solid #e2e8f0", borderLeft:"3px solid #1a3a6b", padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", transition:"box-shadow 0.15s" }}>
                  <div style={{ fontSize:12, color:"#2563eb", fontWeight:700, marginBottom:8 }}>{s.amount}</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:"#0f172a", lineHeight:1.3, marginBottom:8 }}>How to Win the {s.name}</div>
                  <div style={{ fontSize:13, color:"#94a3b8", fontWeight:600 }}>Read guide</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
