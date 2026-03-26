import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { LOCAL_DATA, SCHOLARSHIPS, CAT_META } from "@/lib/data"

function citySlug(city: string) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California",
  CO:"Colorado", CT:"Connecticut", DE:"Delaware", FL:"Florida", GA:"Georgia",
  HI:"Hawaii", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa",
  KS:"Kansas", KY:"Kentucky", LA:"Louisiana", ME:"Maine", MD:"Maryland",
  MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi", MO:"Missouri",
  MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey",
  NM:"New Mexico", NY:"New York", NC:"North Carolina", ND:"North Dakota", OH:"Ohio",
  OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", RI:"Rhode Island", SC:"South Carolina",
  SD:"South Dakota", TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont",
  VA:"Virginia", WA:"Washington", WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming",
}

function getCityScholarships(cityName: string) {
  const nameLower = cityName.toLowerCase()
  return SCHOLARSHIPS.filter(s =>
    s.tags.some(t => t.toLowerCase() === nameLower) ||
    s.eligibility.toLowerCase().includes(nameLower)
  )
}

function getStateScholarships(stateUpper: string) {
  const fullName = STATE_NAMES[stateUpper]
  if (!fullName) return []
  const nameLower = fullName.toLowerCase()
  return SCHOLARSHIPS.filter(s =>
    s.tags.some(t => t.toLowerCase() === nameLower) ||
    s.eligibility.toLowerCase().includes(nameLower)
  )
}

export function generateStaticParams() {
  // Foundation pages
  const foundationParams = LOCAL_DATA.map(f => ({
    state: f.state.toLowerCase(),
    slug: f.slug,
  }))

  // City pages: [city-slug]-scholarships
  const seen = new Set<string>()
  const cityParams: { state: string; slug: string }[] = []
  LOCAL_DATA.forEach(f => {
    const key = `${f.state.toLowerCase()}-${citySlug(f.city)}`
    if (!seen.has(key)) {
      seen.add(key)
      cityParams.push({ state: f.state.toLowerCase(), slug: `${citySlug(f.city)}-scholarships` })
    }
  })

  return [...foundationParams, ...cityParams]
}

export async function generateMetadata({ params }: { params: { state: string; slug: string } }): Promise<Metadata> {
  const stateUpper = params.state.toUpperCase()

  if (params.slug.endsWith("-scholarships")) {
    const cs = params.slug.slice(0, -"-scholarships".length)
    const listings = LOCAL_DATA.filter(f => f.state.toUpperCase() === stateUpper && citySlug(f.city) === cs)
    if (!listings.length) return {}
    const cityName = listings[0].city
    const citySchCount = getCityScholarships(cityName).length
    const stateSchCount = getStateScholarships(stateUpper).length
    const total = listings.length + citySchCount + stateSchCount
    return {
      title: `${cityName} Local Scholarships — ${total} Verified`,
      description: `Find local scholarships in ${cityName}, ${stateUpper}. Verified community foundation awards with less competition than national scholarships.`,
      alternates: { canonical: `/local/${params.state}/${params.slug}` },
    }
  }

  const f = LOCAL_DATA.find(f => f.slug === params.slug)
  if (!f) return {}
  return {
    title: `${f.name} Scholarship — ${f.amount}`,
    description: `${f.eligibility}. Deadline: ${f.deadline}. Verified via IRS 990 filing.`,
    alternates: { canonical: `/local/${params.state}/${params.slug}` },
  }
}

// ─── CITY PAGE ────────────────────────────────────────────────────────────────

function CityPage({ params }: { params: { state: string; slug: string } }) {
  const stateUpper = params.state.toUpperCase()
  const cs = params.slug.slice(0, -"-scholarships".length)
  const listings = LOCAL_DATA.filter(f => f.state.toUpperCase() === stateUpper && citySlug(f.city) === cs)
  if (!listings.length) notFound()

  const cityName = listings[0].city
  const fullStateName = STATE_NAMES[stateUpper] || stateUpper
  const cityScholarships = getCityScholarships(cityName)
  const stateScholarships = getStateScholarships(stateUpper)
  const otherCities = Array.from(new Set(
    LOCAL_DATA
      .filter(f => f.state.toUpperCase() === stateUpper && citySlug(f.city) !== cs)
      .map(f => f.city)
  )).slice(0, 6)

  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"48px 20px" }}>

        {/* BREADCRUMB */}
        <div style={{ display:"flex", gap:8, fontSize:13, color:"#64748b", marginBottom:24, alignItems:"center", flexWrap:"wrap" }}>
          <Link href="/" style={{ color:"#2563eb", textDecoration:"none" }}>Home</Link>
          <span>›</span>
          <Link href="/local" style={{ color:"#2563eb", textDecoration:"none" }}>Local</Link>
          <span>›</span>
          <Link href={`/local/${params.state}`} style={{ color:"#2563eb", textDecoration:"none" }}>{stateUpper}</Link>
          <span>›</span>
          <span style={{ color:"#0f172a", fontWeight:600 }}>{cityName}</span>
        </div>

        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(26px,5vw,34px)", fontWeight:900, color:"#0f172a", marginBottom:8, lineHeight:1.2, letterSpacing:"-0.02em" }}>
          {cityName} Local Scholarships
        </h1>
        <p style={{ color:"#64748b", fontSize:16, marginBottom:40, lineHeight:1.65 }}>
          {listings.length} IRS 990-verified foundation{listings.length !== 1 ? "s" : ""}
          {cityScholarships.length > 0 && ` + ${cityScholarships.length} scholarship${cityScholarships.length !== 1 ? "s" : ""} open to ${cityName} residents`}
          {" — "}{stateUpper}
        </p>

        {/* LOCAL FOUNDATIONS */}
        <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:16 }}>
          Community Foundations
        </h2>
        <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom: cityScholarships.length > 0 || stateScholarships.length > 0 ? 52 : 0 }}>
          {listings.map(s => (
            <Link key={s.id} href={`/local/${s.state.toLowerCase()}/${s.slug}`} style={{ textDecoration:"none" }}>
              <div style={{ background:"white", borderRadius:14, border:"1px solid #e2e8f0", borderLeft:"3px solid #1a7a4a", padding:"22px 26px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:"#0f172a", marginBottom:6, marginTop:0 }}>{s.name}</h3>
                    <p style={{ color:"#475569", fontSize:14, marginBottom:12, marginTop:0, lineHeight:1.5 }}>{s.eligibility}</p>
                    <div style={{ fontSize:13, color:"#64748b" }}>Deadline: {s.deadline}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                    <div style={{ background:"#f0fdf4", color:"#15803d", fontSize:14, fontWeight:700, padding:"6px 14px", borderRadius:999, border:"1px solid #bbf7d0", whiteSpace:"nowrap" }}>{s.amount}</div>
                    <span style={{ fontSize:13, color:"#2563eb", fontWeight:600 }}>View details</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CITY-MATCHED SCHOLARSHIPS */}
        {cityScholarships.length > 0 && (
          <div style={{ marginBottom:52 }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:8 }}>
              Scholarships Open to {cityName} Residents
            </h2>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:20 }}>
              These scholarships specifically mention {cityName} in their eligibility.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {cityScholarships.map(s => {
                const meta = CAT_META[s.category]
                return (
                  <Link key={s.id} href={`/scholarships/${s.slug}`} style={{ textDecoration:"none" }}>
                    <div style={{ background:"white", borderRadius:14, border:"1px solid #e2e8f0", borderLeft:`3px solid ${meta.color}`, padding:"22px 26px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                        <div style={{ flex:1, minWidth:200 }}>
                          <div style={{ marginBottom:6 }}>
                            <span style={{ background:`${meta.color}18`, color:meta.color, fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:999, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>
                              {meta.label}
                            </span>
                          </div>
                          <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:"#0f172a", marginBottom:6, marginTop:0 }}>{s.name}</h3>
                          <p style={{ color:"#475569", fontSize:14, marginBottom:10, marginTop:0, lineHeight:1.5 }}>{s.eligibility}</p>
                          <div style={{ fontSize:13, color:"#64748b" }}>
                            {s.deadline && <span>Deadline: {s.deadline}</span>}
                          </div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                          <div style={{ background:`${meta.color}14`, color:meta.color, fontSize:14, fontWeight:800, padding:"6px 14px", borderRadius:999, whiteSpace:"nowrap" }}>{s.amount}</div>
                          <span style={{ fontSize:13, color:"#2563eb", fontWeight:600 }}>View scholarship</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* STATE-LEVEL SCHOLARSHIPS */}
        {stateScholarships.length > 0 && (
          <div style={{ marginBottom:52 }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:8 }}>
              Scholarships Open to {fullStateName} Residents
            </h2>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:20 }}>
              These scholarships specifically target {fullStateName} residents or students at {fullStateName} schools.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {stateScholarships.map(s => {
                const meta = CAT_META[s.category]
                return (
                  <Link key={s.id} href={`/scholarships/${s.slug}`} style={{ textDecoration:"none" }}>
                    <div style={{ background:"white", borderRadius:14, border:"1px solid #e2e8f0", borderLeft:`3px solid ${meta.color}`, padding:"22px 26px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                        <div style={{ flex:1, minWidth:200 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                            <span style={{ background:`${meta.color}18`, color:meta.color, fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:999, textTransform:"uppercase" as const, letterSpacing:"0.06em" }}>
                              {meta.label}
                            </span>
                            {s.renewable && (
                              <span style={{ background:"#e8f5ee", color:"#1a7a4a", fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:999 }}>Renewable</span>
                            )}
                          </div>
                          <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:"#0f172a", marginBottom:6, marginTop:0 }}>{s.name}</h3>
                          <p style={{ color:"#475569", fontSize:14, marginBottom:10, marginTop:0, lineHeight:1.5 }}>{s.eligibility}</p>
                          <div style={{ fontSize:13, color:"#64748b" }}>
                            {s.deadline && <span>Deadline: {s.deadline}</span>}
                            {s.deadline && s.gpa !== "N/A" && <span style={{ margin:"0 10px" }}>·</span>}
                            {s.gpa !== "N/A" && <span>GPA: {s.gpa}</span>}
                          </div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                          <div style={{ background:`${meta.color}14`, color:meta.color, fontSize:14, fontWeight:800, padding:"6px 14px", borderRadius:999, whiteSpace:"nowrap" }}>{s.amount}</div>
                          <span style={{ fontSize:13, color:"#2563eb", fontWeight:600 }}>View scholarship</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* OTHER CITIES IN STATE */}
        {otherCities.length > 0 && (
          <div style={{ marginTop:48 }}>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:16 }}>
              Other {stateUpper} Cities
            </h2>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {otherCities.map(city => (
                <Link key={city} href={`/local/${params.state}/${citySlug(city)}-scholarships`}
                  style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, padding:"8px 16px", fontSize:14, color:"#2563eb", textDecoration:"none", fontWeight:500 }}>
                  {city}
                </Link>
              ))}
              <Link href={`/local/${params.state}`}
                style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"8px 16px", fontSize:14, color:"#1d4ed8", textDecoration:"none", fontWeight:600 }}>
                All {stateUpper} foundations
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── FOUNDATION PAGE ──────────────────────────────────────────────────────────

function FoundationPage({ params }: { params: { state: string; slug: string } }) {
  const f = LOCAL_DATA.find(f => f.slug === params.slug)
  if (!f) notFound()

  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ maxWidth:"800px", margin:"0 auto", padding:"48px 20px" }}>

        <div style={{ marginBottom:"24px", display:"flex", gap:"8px", alignItems:"center", fontSize:"14px" }}>
          <Link href="/local" style={{ color:"#2563eb", textDecoration:"none" }}>Local</Link>
          <span style={{ color:"#94a3b8" }}>/</span>
          <Link href={`/local/${f.state.toLowerCase()}`} style={{ color:"#2563eb", textDecoration:"none" }}>{f.state}</Link>
          <span style={{ color:"#94a3b8" }}>/</span>
          <Link href={`/local/${f.state.toLowerCase()}/${citySlug(f.city)}-scholarships`} style={{ color:"#2563eb", textDecoration:"none" }}>{f.city}</Link>
          <span style={{ color:"#94a3b8" }}>/</span>
          <span style={{ color:"#64748b" }}>{f.name}</span>
        </div>

        <div style={{ background:"white", borderRadius:"16px", border:"1px solid #e2e8f0", padding:"40px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ marginBottom:"24px" }}>
            <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"28px", fontWeight:900, color:"#0f172a", marginBottom:"12px", marginTop:0, lineHeight:1.3 }}>{f.name}</h1>
            <span style={{ background:"#f0fdf4", color:"#15803d", fontSize:"15px", fontWeight:700, padding:"6px 16px", borderRadius:"999px", border:"1px solid #bbf7d0" }}>
              {f.amount}
            </span>
          </div>

          <div style={{ borderTop:"1px solid #f1f5f9", paddingTop:"24px", display:"grid", gap:"16px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
              <div style={{ background:"#f8fafc", borderRadius:"10px", padding:"16px" }}>
                <div style={{ fontSize:"12px", color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"6px" }}>Deadline</div>
                <div style={{ fontSize:"16px", fontWeight:600, color:"#0f172a" }}>{f.deadline}</div>
              </div>
              <div style={{ background:"#f8fafc", borderRadius:"10px", padding:"16px" }}>
                <div style={{ fontSize:"12px", color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"6px" }}>Location</div>
                <div style={{ fontSize:"16px", fontWeight:600, color:"#0f172a" }}>{f.city}, {f.state}</div>
              </div>
            </div>

            <div style={{ background:"#f8fafc", borderRadius:"10px", padding:"16px" }}>
              <div style={{ fontSize:"12px", color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"8px" }}>Eligibility</div>
              <div style={{ fontSize:"15px", color:"#334155", lineHeight:1.6 }}>{f.eligibility}</div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginTop:"8px" }}>
              <a href={f.url} target="_blank" rel="noopener noreferrer"
                style={{ display:"block", background:"#2563eb", color:"white", textAlign:"center", padding:"14px", borderRadius:"10px", textDecoration:"none", fontWeight:700, fontSize:"15px" }}>
                Apply Now
              </a>
              <a href={f.propublica_url} target="_blank" rel="noopener noreferrer"
                style={{ display:"block", background:"#f8fafc", color:"#475569", textAlign:"center", padding:"14px", borderRadius:"10px", textDecoration:"none", fontWeight:600, fontSize:"15px", border:"1px solid #e2e8f0" }}>
                View 990 Filing
              </a>
            </div>
          </div>

          <div style={{ marginTop:"24px", padding:"16px", background:"#fffbeb", borderRadius:"10px", border:"1px solid #fde68a" }}>
            <p style={{ margin:0, fontSize:"13px", color:"#92400e", lineHeight:1.6 }}>
              Always verify deadlines and eligibility directly with the foundation before applying.
            </p>
          </div>
        </div>

        <div style={{ marginTop:"24px", display:"flex", gap:16, flexWrap:"wrap" }}>
          <Link href={`/local/${f.state.toLowerCase()}/${citySlug(f.city)}-scholarships`} style={{ color:"#2563eb", textDecoration:"none", fontSize:"14px" }}>
            ← All {f.city} scholarships
          </Link>
          <Link href={`/local/${f.state.toLowerCase()}`} style={{ color:"#64748b", textDecoration:"none", fontSize:"14px" }}>
            All {f.state} foundations
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────

export default function SlugPage({ params }: { params: { state: string; slug: string } }) {
  if (params.slug.endsWith("-scholarships")) {
    return <CityPage params={params} />
  }
  return <FoundationPage params={params} />
}
