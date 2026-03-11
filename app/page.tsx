import Link from "next/link"
import type { Metadata } from "next"
import { SCHOLARSHIPS, LOCAL_DATA, CAT_META } from "@/lib/data"
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/utils"

export const metadata: Metadata = {
  title: `${SITE_NAME} — Free Scholarships, Grants & Trades`,
  description: SITE_DESCRIPTION,
}

const CATEGORIES = [
  { id: "scholarship", href: "/scholarships?cat=scholarship", stat: SCHOLARSHIPS.filter(s=>s.category==="scholarship").length },
  { id: "grant",       href: "/scholarships?cat=grant",       stat: SCHOLARSHIPS.filter(s=>s.category==="grant").length },
  { id: "trade",       href: "/scholarships?cat=trade",       stat: SCHOLARSHIPS.filter(s=>s.category==="trade").length },
  { id: "other",       href: "/scholarships?cat=other",       stat: SCHOLARSHIPS.filter(s=>s.category==="other").length },
  { id: "local",       href: "/local",                        stat: LOCAL_DATA.length },
]

const FEATURED = SCHOLARSHIPS.filter(s => s.renewable).slice(0, 6)

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">✦ Free. No signup. No spam.</div>
          <h1>Find Your<br/><span>Free Money</span></h1>
          <p className="hero-sub">
            {SCHOLARSHIPS.length + LOCAL_DATA.length}+ scholarships, grants, trades & local foundations —<br/>
            all verified, all free to apply.
          </p>
          <Link href="/scholarships" className="btn-primary" style={{fontSize:16,padding:"14px 32px",borderRadius:14,marginBottom:16,display:"inline-flex"}}>
            Browse All Scholarships →
          </Link>
        </div>
      </section>

      <div className="page-wrap">
        {/* CATEGORY CARDS */}
        <div style={{marginBottom:48}}>
          <h2 className="section-title" style={{marginBottom:6}}>Browse by <span>Category</span></h2>
          <p className="section-sub" style={{marginBottom:20}}>From full-ride awards to no-essay sweepstakes — find what fits you.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
            {CATEGORIES.map(cat => {
              const meta = CAT_META[cat.id]
              return (
                <Link key={cat.id} href={cat.href} style={{background:"#fff",border:"1.5px solid #e8edf5",borderRadius:16,padding:"20px",textDecoration:"none",color:"inherit",transition:"all 0.15s",display:"block"}}
                  onMouseOver={undefined}>
                  <div style={{fontSize:28,marginBottom:8}}>{meta.icon}</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:700,color:"#0d1f3c",marginBottom:4}}>{meta.label}</div>
                  <div style={{fontSize:13,color:meta.color,fontWeight:700}}>{cat.stat} available</div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* FEATURED RENEWABLE */}
        <div style={{marginBottom:48}}>
          <h2 className="section-title" style={{marginBottom:6}}>↺ Renewable <span>Scholarships</span></h2>
          <p className="section-sub" style={{marginBottom:20}}>These awards renew each year — apply once, get paid for multiple years.</p>
          <div className="card-grid">
            {FEATURED.map((s, i) => (
              <Link key={s.id} href={`/scholarships/${s.slug}`} className="card" style={{animationDelay:`${i*0.05}s`}}>
                <div className="card-accent" style={{background:`linear-gradient(90deg,${CAT_META[s.category].color},${CAT_META[s.category].color}88)`}} />
                <div className="card-body">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <span className="card-cat" style={{color:CAT_META[s.category].color,background:`${CAT_META[s.category].color}14`}}>
                      {CAT_META[s.category].icon} {CAT_META[s.category].label}
                    </span>
                    <span className="renewable-badge">↺ Renewable</span>
                  </div>
                  <div className="card-name">{s.name}</div>
                  <div className="card-amount">{s.amount}</div>
                  <p className="card-elig">{s.eligibility}</p>
                  <div className="card-footer">
                    <div className="card-meta">
                      {s.deadline && <span>📅 {s.deadline}</span>}
                      <span>GPA {s.gpa}</span>
                    </div>
                    <span className="card-cta">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:24}}>
            <Link href="/scholarships" className="btn-ghost">View all {SCHOLARSHIPS.length} scholarships →</Link>
          </div>
        </div>

        {/* NO-ESSAY CALLOUT */}
        <div style={{background:"linear-gradient(135deg,#f0f4ff,#e8edf8)",border:"1.5px solid #c5cde0",borderRadius:20,padding:"32px",marginBottom:48,display:"flex",gap:24,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,color:"#0d1f3c",marginBottom:6}}>🎯 No Essay? No Problem.</div>
            <p style={{fontSize:14,color:"#5a6a8a",lineHeight:1.65,maxWidth:500}}>
              We track {SCHOLARSHIPS.filter(s=>s.tags.includes("no-essay")).length}+ scholarships that require zero essays — just a quick form or random drawing. Apply to all of them in an afternoon.
            </p>
          </div>
          <Link href="/scholarships?tag=no-essay" className="btn-primary">Browse No-Essay Awards →</Link>
        </div>

        {/* LOCAL CALLOUT */}
        <div style={{background:"linear-gradient(135deg,#e8f5ee,#f0fbf5)",border:"1.5px solid #c5e8d5",borderRadius:20,padding:"32px",marginBottom:48,display:"flex",gap:24,flexWrap:"wrap",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,color:"#0d2e1a",marginBottom:6}}>📍 Hidden Local Scholarships</div>
            <p style={{fontSize:14,color:"#3a7a55",lineHeight:1.65,maxWidth:500}}>
              Community foundations manage {LOCAL_DATA.length}+ local scholarship funds invisible to national sites. 990-verified. Less competition than national awards.
            </p>
          </div>
          <Link href="/local" className="btn-primary" style={{background:"#1a7a4a"}}>Find Local Scholarships →</Link>
        </div>

        {/* SEO FOOTER NOTE */}
        <div style={{paddingTop:20,borderTop:"1.5px solid #e8edf5",fontSize:13,color:"#c5cde0",textAlign:"center",lineHeight:1.9,fontWeight:500}}>
          Always verify deadlines and eligibility at the official source. Amounts change yearly.<br/>
          <strong style={{color:"#1a3a6b"}}>💡 Tip:</strong> File your FAFSA early — it unlocks most grants and many scholarships.
        </div>
      </div>
    </>
  )
}
