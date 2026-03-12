import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SCHOLARSHIPS } from "@/lib/data"
import { SITE_NAME } from "@/lib/utils"

function getAllTags() {
  const set = new Set<string>()
  SCHOLARSHIPS.forEach(s => s.tags.forEach(t => set.add(t)))
  return Array.from(set).sort()
}

export async function generateStaticParams() {
  return getAllTags().map(tag => ({ tag }))
}

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag)
  const matches = SCHOLARSHIPS.filter(s => s.tags.includes(tag))
  if (!matches.length) return {}
  const label = tag.replace(/-/g, " ")
  return {
    title: `${label} Scholarships — ${matches.length} Awards | ${SITE_NAME}`,
    description: `Browse ${matches.length} verified ${label} scholarships. All free to apply, no registration required.`,
    alternates: { canonical: `/scholarships/tag/${tag}` },
  }
}

export default function TagPage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag)
  const matches = SCHOLARSHIPS.filter(s => s.tags.includes(tag))
  if (!matches.length) notFound()
  const label = tag.replace(/-/g, " ")
  const relatedTags = new Set<string>()
  matches.forEach(s => s.tags.forEach(t => { if (t !== tag) relatedTags.add(t) }))
  const related = Array.from(relatedTags).slice(0, 8)
  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"48px 20px" }}>
        <div style={{ display:"flex", gap:8, fontSize:13, color:"#64748b", marginBottom:24, alignItems:"center" }}>
          <Link href="/" style={{ color:"#2563eb", textDecoration:"none" }}>Home</Link>
          <span>›</span>
          <Link href="/scholarships" style={{ color:"#2563eb", textDecoration:"none" }}>Scholarships</Link>
          <span>›</span>
          <span style={{ color:"#0f172a", fontWeight:600 }}>{label}</span>
        </div>
        <h1 style={{ fontSize:32, fontWeight:800, color:"#0f172a", marginBottom:8, textTransform:"capitalize" }}>
          🎓 {label} Scholarships
        </h1>
        <p style={{ color:"#64748b", fontSize:16, marginBottom:16 }}>
          {matches.length} verified awards — all free to apply
        </p>
        {related.length > 0 && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:40 }}>
            {related.map(t => (
              <Link key={t} href={`/scholarships/tag/${t}`} style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:999, padding:"4px 12px", fontSize:13, color:"#475569", textDecoration:"none", fontWeight:500 }}>
                {t.replace(/-/g, " ")}
              </Link>
            ))}
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {matches.map(s => (
            <Link key={s.id} href={`/scholarships/${s.slug}`} style={{ textDecoration:"none" }}>
              <div style={{ background:"white", borderRadius:14, border:"1px solid #e2e8f0", padding:"24px 28px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <h2 style={{ fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:6, marginTop:0 }}>{s.name}</h2>
                    <p style={{ color:"#475569", fontSize:14, marginBottom:12, marginTop:0, lineHeight:1.5 }}>{s.eligibility}</p>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {s.tags.slice(0,4).map(t => (
                        <span key={t} style={{ background:t===tag?"#eff6ff":"#f1f5f9", color:t===tag?"#2563eb":"#64748b", border:t===tag?"1px solid #bfdbfe":"1px solid #e2e8f0", borderRadius:999, padding:"2px 10px", fontSize:12, fontWeight:600 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                    <div style={{ background:"#f0fdf4", color:"#15803d", fontSize:14, fontWeight:700, padding:"6px 14px", borderRadius:999, border:"1px solid #bbf7d0", whiteSpace:"nowrap" }}>{s.amount}</div>
                    {s.deadline && <div style={{ fontSize:13, color:"#64748b" }}>📅 {s.deadline}</div>}
                    <span style={{ fontSize:13, color:"#2563eb", fontWeight:600 }}>View →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ marginTop:48, padding:"32px", background:"white", borderRadius:16, border:"1px solid #e2e8f0", textAlign:"center" }}>
          <div style={{ fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Looking for local awards?</div>
          <p style={{ color:"#64748b", marginBottom:20 }}>Community foundation scholarships have less competition than national awards.</p>
          <Link href="/local" style={{ display:"inline-block", background:"#2563eb", color:"white", padding:"12px 28px", borderRadius:12, textDecoration:"none", fontWeight:700, fontSize:15 }}>Browse Local Foundations →</Link>
        </div>
      </div>
    </div>
  )
}
