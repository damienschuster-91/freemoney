import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SCHOLARSHIPS, CAT_META } from "@/lib/data"
import { getAllPosts, getPostBySlug, renderMarkdown } from "@/lib/blog"

export async function generateStaticParams() {
  const scholarshipSlugs = SCHOLARSHIPS.map(s => ({ slug: s.slug }))
  const blogSlugs = getAllPosts().map(p => ({ slug: p.slug }))
  const seen = new Set<string>()
  return [...blogSlugs, ...scholarshipSlugs].filter(({ slug }) => {
    if (seen.has(slug)) return false
    seen.add(slug)
    return true
  })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (post) return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
  }
  const s = SCHOLARSHIPS.find(x => x.slug === params.slug)
  if (!s) return {}
  return {
    title: `How to Win the ${s.name} (${s.amount})`,
    description: `Complete guide to the ${s.name}: eligibility, application tips. ${s.amount} available.`,
    alternates: { canonical: `/blog/${s.slug}` },
  }
}

function formatDate(iso: string) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function AuthorBio({ reviewed }: { reviewed: string }) {
  return (
    <div className="author-bio">
      <div className="author-avatar">D</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="author-name">Damien</div>
        <div className="author-role">Founder, LocalScholarships.org</div>
        <p className="author-bio-text">
          I built LocalScholarships.org after missing out on dozens of local scholarships in high school. Every listing is free, verified, and updated regularly.
        </p>
        <div className="author-links">
          <Link href="/about" style={{ color:"var(--blue)", textDecoration:"underline" }}>
            Read my full story
          </Link>
          {reviewed && (
            <span>Last reviewed: {formatDate(reviewed)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function generateArticle(s: (typeof SCHOLARSHIPS)[number]) {
  const meta = CAT_META[s.category]
  const isNoEssay = s.tags.includes("no-essay")
  const isRenewable = s.renewable
  return {
    intro: `The ${s.name} is one of the ${s.amount.includes("Full") ? "most prestigious full-ride" : "top"} ${meta.label.toLowerCase()} opportunities available. ${s.eligibility}`,
    quickFacts: [
      { label: "Award", value: s.amount },
      { label: "Deadline", value: s.deadline || "Check official site" },
      { label: "GPA Required", value: s.gpa || "None stated" },
      { label: "Renewable", value: isRenewable ? "Yes — multi-year" : "One-time award" },
    ],
    sections: [
      { heading: "Who Is This For?", body: `${s.eligibility} If you meet these criteria, you should apply — the ROI is high, especially ${isNoEssay ? "since no essay is required" : "relative to other competitive scholarships"}.` },
      { heading: isNoEssay ? "How to Apply (No Essay)" : "Application Tips", body: isNoEssay ? "Complete the form accurately and completely. Even though it is quick, treat it seriously — some no-essay awards still review GPA or activities." : "Start 4-6 weeks before the deadline. Review the prompt carefully and use specific examples from your life. Have at least two people proofread before submitting." },
      { heading: isRenewable ? "Keeping the Award" : "After You Apply", body: isRenewable ? "Understand the renewal requirements — usually a minimum GPA and continued enrollment — before accepting. The multi-year value makes this one of the highest-ROI applications you can submit." : "After submitting, confirm receipt if possible. Award decisions are typically announced 4-8 weeks after the deadline." },
    ],
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (post) {
    return (
      <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
        <div style={{ maxWidth:"720px", margin:"0 auto", padding:"48px 20px" }}>
          <div style={{ display:"flex", gap:8, fontSize:13, color:"#64748b", marginBottom:24, alignItems:"center" }}>
            <Link href="/" style={{ color:"#2563eb", textDecoration:"none" }}>Home</Link>
            <span>›</span>
            <Link href="/blog" style={{ color:"#2563eb", textDecoration:"none" }}>Blog</Link>
            <span>›</span>
            <span style={{ color:"#0f172a", fontWeight:600 }}>{post.title}</span>
          </div>
          <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(28px,5vw,44px)", fontWeight:900, color:"#0d1f3c", lineHeight:1.15, letterSpacing:"-0.02em", marginBottom:16 }}>{post.title}</h1>
          <div style={{ display:"flex", gap:10, alignItems:"center", fontSize:13, color:"#94a3b8", fontWeight:600, marginBottom:16 }}>
            {post.date && <span>{post.date}</span>}
            {post.date && <span>·</span>}
            <span>{post.readingTime} min read</span>
          </div>
          {post.tags.length > 0 && (
            <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
              {post.tags.map(t => <span key={t} className="tag-chip">{t}</span>)}
            </div>
          )}
          <AuthorBio reviewed={post.reviewed} />
          <article className="blog-article" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
          <div style={{ marginTop:48, padding:"24px", background:"#eff6ff", borderRadius:14, border:"1px solid #bfdbfe" }}>
            <strong style={{ color:"#1d4ed8" }}>Find your local scholarships</strong>
            <p style={{ color:"#475569", marginTop:8, marginBottom:16 }}>Community foundation scholarships have far less competition than national awards.</p>
            <Link href="/local" style={{ background:"#2563eb", color:"white", padding:"10px 22px", borderRadius:10, textDecoration:"none", fontWeight:700, fontSize:14 }}>Browse Local Foundations</Link>
          </div>
        </div>
      </div>
    )
  }

  const s = SCHOLARSHIPS.find(x => x.slug === params.slug)
  if (!s) notFound()
  const meta = CAT_META[s.category]
  const article = generateArticle(s)
  const related = SCHOLARSHIPS.filter(x => x.category === s.category && x.id !== s.id).slice(0, 3)
  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ maxWidth:"720px", margin:"0 auto", padding:"48px 20px" }}>
        <div style={{ display:"flex", gap:8, fontSize:13, color:"#64748b", marginBottom:24, alignItems:"center" }}>
          <Link href="/" style={{ color:"#2563eb", textDecoration:"none" }}>Home</Link>
          <span>›</span>
          <Link href="/blog" style={{ color:"#2563eb", textDecoration:"none" }}>Blog</Link>
          <span>›</span>
          <span style={{ color:"#0f172a", fontWeight:600, maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
        </div>
        <span style={{ background:`${meta.color}18`, color:meta.color, borderRadius:999, padding:"3px 12px", fontSize:12, fontWeight:700 }}>{meta.icon} {meta.label}</span>
        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:900, color:"#0f172a", lineHeight:1.2, margin:"16px 0 32px" }}>How to Win the {s.name}</h1>
        <div style={{ background:"#f8faff", border:"1.5px solid #dce4f5", borderRadius:14, padding:"20px 24px", marginBottom:32 }}>
          <div style={{ fontWeight:700, color:"#1a3a6b", marginBottom:12, fontSize:12, textTransform:"uppercase", letterSpacing:"0.08em" }}>Quick Facts</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12 }}>
            {article.quickFacts.map(f => (
              <div key={f.label}>
                <div style={{ fontSize:11, color:"#8a9abb", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>{f.label}</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#0d1f3c", marginTop:3 }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
        <article style={{ fontSize:17, lineHeight:1.85, color:"#334155" }}>
          <p>{article.intro}</p>
          {article.sections.map(sec => (
            <div key={sec.heading}>
              <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:700, color:"#0f172a", marginTop:36, marginBottom:12 }}>{sec.heading}</h2>
              <p>{sec.body}</p>
            </div>
          ))}
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"20px 24px", margin:"32px 0" }}>
            <strong style={{ color:"#15803d" }}>Ready to apply?</strong>
            <p style={{ color:"#374151", marginTop:8, marginBottom:16 }}>Visit the official {s.name} website for the current application and deadline.</p>
            <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ background:"#16a34a", color:"white", padding:"10px 22px", borderRadius:10, textDecoration:"none", fontWeight:700, fontSize:14, display:"inline-block" }}>Apply on Official Site</a>
          </div>
          <p style={{ fontSize:13, color:"#94a3b8", fontStyle:"italic" }}>Always verify current deadlines and eligibility at the official source. Details change yearly.</p>
        </article>
        {related.length > 0 && (
          <div style={{ marginTop:48 }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:16 }}>More {meta.label} Guides</h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12 }}>
              {related.map(r => (
                <Link key={r.id} href={`/blog/${r.slug}`} style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:"16px", textDecoration:"none" }}>
                  <div style={{ fontSize:12, color:meta.color, fontWeight:700, marginBottom:6 }}>{r.amount}</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:"#0d1f3c", lineHeight:1.3 }}>How to Win the {r.name}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
