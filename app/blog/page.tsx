import type { Metadata } from "next"
import Link from "next/link"
import { SCHOLARSHIPS } from "@/lib/data"
import { getAllPosts } from "@/lib/blog"
import { SITE_NAME } from "@/lib/utils"

export const metadata: Metadata = {
  title: `Scholarship Guides & Tips | ${SITE_NAME}`,
  description: "How-to guides for winning scholarships, understanding deadlines, and finding local awards with less competition.",
  alternates: { canonical: "/blog" },
}

export default function BlogPage() {
  const realPosts = getAllPosts()
  const autoGuides = SCHOLARSHIPS.slice(0, 12)
  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"48px 20px" }}>
        <h1 style={{ fontSize:32, fontWeight:800, color:"#0f172a", marginBottom:8 }}>Scholarship Guides</h1>
        <p style={{ color:"#64748b", fontSize:16, marginBottom:48 }}>Strategy, tips, and deep-dives on winning scholarships and finding local money.</p>
        {realPosts.length > 0 && (
          <div style={{ marginBottom:56 }}>
            <h2 style={{ fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:20 }}>Latest Posts</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {realPosts.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration:"none" }}>
                  <div style={{ background:"white", borderRadius:14, border:"1px solid #e2e8f0", padding:"24px 28px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"flex-start" }}>
                      <div>
                        <h3 style={{ fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:8, marginTop:0 }}>{post.title}</h3>
                        <p style={{ color:"#475569", fontSize:14, marginTop:0, lineHeight:1.5 }}>{post.description}</p>
                        {post.tags.length > 0 && (
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:12 }}>
                            {post.tags.map(t => (
                              <span key={t} style={{ background:"#f1f5f9", color:"#64748b", borderRadius:999, padding:"2px 10px", fontSize:12, fontWeight:600 }}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink:0, fontSize:13, color:"#94a3b8", whiteSpace:"nowrap" }}>{post.date}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:20 }}>Scholarship Guides</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:16 }}>
            {autoGuides.map(s => (
              <Link key={s.id} href={`/blog/${s.slug}`} style={{ textDecoration:"none" }}>
                <div style={{ background:"white", borderRadius:14, border:"1px solid #e2e8f0", padding:"20px 22px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize:12, color:"#2563eb", fontWeight:700, marginBottom:8 }}>{s.amount}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", lineHeight:1.3, marginBottom:8 }}>How to Win the {s.name}</div>
                  <div style={{ fontSize:13, color:"#94a3b8", fontWeight:600 }}>Read guide →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
