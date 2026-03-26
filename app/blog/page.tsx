import type { Metadata } from "next"
import Link from "next/link"
import { getAllPosts } from "@/lib/blog"

export const metadata: Metadata = {
  title: "Scholarship Guides & Tips",
  description: "How-to guides for winning scholarships, understanding deadlines, and finding local awards with less competition.",
  alternates: { canonical: "/blog" },
}

export default function BlogPage() {
  const realPosts = getAllPosts()
  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"48px 20px" }}>
        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:900, color:"#0d1f3c", marginBottom:8, letterSpacing:"-0.02em" }}>Scholarship Guides</h1>
        <p style={{ color:"#64748b", fontSize:17, marginBottom:48, lineHeight:1.65 }}>Strategy, tips, and deep-dives on winning scholarships and finding local money.</p>
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
    </div>
  )
}
