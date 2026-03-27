import Link from "next/link"
import type { Metadata } from "next"
import { SCHOLARSHIPS, LOCAL_DATA, CAT_META } from "@/lib/data"
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/utils"
import LocalSearchClient from "@/components/LocalSearchClient"

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — Free Scholarships, Grants & Trades` },
  description: SITE_DESCRIPTION,
}

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
}

// Top states by listing count
function topStates(n: number) {
  const idx: Record<string, number> = {}
  for (const f of LOCAL_DATA) idx[f.state] = (idx[f.state] || 0) + 1
  return Object.entries(idx).sort((a, b) => b[1] - a[1]).slice(0, n)
}

const CATEGORIES = [
  { id: "local",       href: "/local",                        stat: LOCAL_DATA.length },
  { id: "scholarship", href: "/scholarships?cat=scholarship", stat: SCHOLARSHIPS.filter(s=>s.category==="scholarship").length },
  { id: "grant",       href: "/scholarships?cat=grant",       stat: SCHOLARSHIPS.filter(s=>s.category==="grant").length },
  { id: "trade",       href: "/scholarships?cat=trade",       stat: SCHOLARSHIPS.filter(s=>s.category==="trade").length },
  { id: "other",       href: "/scholarships?cat=other",       stat: SCHOLARSHIPS.filter(s=>s.category==="other").length },
]

const FEATURED = SCHOLARSHIPS.filter(s => s.renewable).slice(0, 6)

export default function HomePage() {
  const stateList = topStates(9)

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">Free. No signup. No spam.</div>
          <h1>Find Your<br/><span>Free Money</span></h1>
          <p className="hero-sub">
            {SCHOLARSHIPS.length + LOCAL_DATA.length}+ scholarships, grants, trades & local foundations —<br/>
            all verified, all free to apply.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/local" className="btn-primary" style={{ fontSize: 16, padding: "14px 32px", borderRadius: 14, display: "inline-flex", background: "#1a7a4a" }}>
              Find Local Scholarships
            </Link>
            <Link href="/scholarships" className="btn-ghost" style={{ fontSize: 16, padding: "14px 32px", borderRadius: 14, display: "inline-flex", color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
              Browse All
            </Link>
          </div>
        </div>
      </section>

      <div className="page-wrap">

        {/* LOCAL FOUNDATIONS SECTION */}
        <div style={{ marginBottom: 48 }}>
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            Local Scholarships <span>In Your State</span>
          </h2>
          <p className="section-sub" style={{ marginBottom: 20 }}>
            {LOCAL_DATA.length}+ community foundations verified via IRS 990 filings. Less competition. Often easier to win.
          </p>

          {/* Embedded search */}
          <LocalSearchClient data={LOCAL_DATA as any} />

          {/* Why local wins */}
          <div className="info-box" style={{ marginBottom: 20 }}>
            <div className="info-box-title">💡 Why Local Scholarships Win</div>
            <p className="info-box-text">
              National scholarships get tens of thousands of applicants. Local foundations often get fewer than 50. These funds are required by law to give money away every year — they just don't advertise.
            </p>
          </div>

          {/* Top states grid */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {stateList.map(([abbr, count]) => (
              <Link
                key={abbr}
                href={`/local/${abbr.toLowerCase()}`}
                className="pill"
                style={{ gap: 8 }}
              >
                📍 {STATE_NAMES[abbr] || abbr}
                <span style={{ background: "#e8f5ee", color: "#1a7a4a", borderRadius: 100, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>
                  {count}
                </span>
              </Link>
            ))}
          </div>
          <Link href="/local" style={{ fontSize: 13, color: "#2563eb", fontWeight: 600 }}>
            View all states →
          </Link>
        </div>

        {/* CATEGORY CARDS */}
        <div style={{ marginBottom: 48 }}>
          <h2 className="section-title" style={{ marginBottom: 6 }}>Browse by <span>Category</span></h2>
          <p className="section-sub" style={{ marginBottom: 20 }}>From full-ride awards to no-essay sweepstakes — find what fits you.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {CATEGORIES.map(cat => {
              const meta = CAT_META[cat.id]
              return (
                <Link key={cat.id} href={cat.href} className="cat-card" style={{ borderBottomColor: meta.color }}>
                  <span className="cat-card-icon">{meta.icon}</span>
                  <div className="cat-card-name">{meta.label}</div>
                  <div className="cat-card-stat" style={{ color: meta.color }}>{cat.stat} available</div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* RENEWABLE SCHOLARSHIPS */}
        <div style={{ marginBottom: 48 }}>
          <h2 className="section-title" style={{ marginBottom: 6 }}>Renewable <span>Scholarships</span></h2>
          <p className="section-sub" style={{ marginBottom: 20 }}>These awards renew each year — apply once, get paid for multiple years.</p>
          <div className="card-grid">
            {FEATURED.map((s, i) => (
              <Link key={s.id} href={`/scholarships/${s.slug}`} className="card" style={{ animationDelay: `${i*0.05}s`, borderLeft: `3px solid ${CAT_META[s.category].color}` }}>
                <div className="card-accent" style={{ background: `linear-gradient(90deg,${CAT_META[s.category].color},${CAT_META[s.category].color}88)` }} />
                <div className="card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <span className="card-cat" style={{ color: CAT_META[s.category].color, background: `${CAT_META[s.category].color}14` }}>
                      {CAT_META[s.category].icon} {CAT_META[s.category].label}
                    </span>
                    <span className="renewable-badge">Renewable</span>
                  </div>
                  <div className="card-name">{s.name}</div>
                  <div className="card-amount">{s.amount}</div>
                  <p className="card-elig">{s.eligibility}</p>
                  <div className="card-footer">
                    <div className="card-meta">
                      {s.deadline && <span>{s.deadline}</span>}
                      <span>GPA {s.gpa}</span>
                    </div>
                    <span className="card-cta">View</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <Link href="/scholarships" className="btn-ghost">View all {SCHOLARSHIPS.length} scholarships</Link>
          </div>
        </div>

        {/* NO-ESSAY CALLOUT */}
        <div style={{ background: "linear-gradient(135deg,#f0f4ff,#e8edf8)", border: "1.5px solid #c5cde0", borderRadius: 20, padding: "32px", marginBottom: 48, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 900, color: "#0d1f3c", marginBottom: 6 }}>No Essay? No Problem.</div>
            <p style={{ fontSize: 14, color: "#5a6a8a", lineHeight: 1.65, maxWidth: 500 }}>
              We track {SCHOLARSHIPS.filter(s=>s.tags.includes("no-essay")).length}+ scholarships that require zero essays — just a quick form or random drawing. Apply to all of them in an afternoon.
            </p>
          </div>
          <Link href="/scholarships?tag=no-essay" className="btn-primary">Browse No-Essay Awards</Link>
        </div>

        {/* SEO FOOTER NOTE */}
        <div style={{ paddingTop: 20, borderTop: "1.5px solid #e8edf5", fontSize: 13, color: "#c5cde0", textAlign: "center", lineHeight: 1.9, fontWeight: 500 }}>
          Always verify deadlines and eligibility at the official source. Amounts change yearly.<br/>
          <strong style={{ color: "#1a3a6b" }}>Tip:</strong> File your FAFSA early — it unlocks most grants and many scholarships.
        </div>
      </div>
    </>
  )
}
