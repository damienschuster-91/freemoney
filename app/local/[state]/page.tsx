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

function getStateScholarships(stateUpper: string) {
  const fullName = STATE_NAMES[stateUpper]
  if (!fullName) return []
  const nameLower = fullName.toLowerCase()
  return SCHOLARSHIPS.filter(s => {
    const tagsMatch = s.tags.some(t => t.toLowerCase() === nameLower)
    const eligMatch = s.eligibility.toLowerCase().includes(nameLower)
    return tagsMatch || eligMatch
  })
}

export function generateStaticParams() {
  const states = Array.from(new Set(LOCAL_DATA.map(l => l.state.toUpperCase())))
  return states.map(state => ({ state: state.toLowerCase() }))
}

export async function generateMetadata({ params }: { params: { state: string } }) {
  const stateUpper = params.state.toUpperCase()
  const localCount = LOCAL_DATA.filter(l => l.state.toUpperCase() === stateUpper).length
  const schCount = getStateScholarships(stateUpper).length
  const total = localCount + schCount
  const fullName = STATE_NAMES[stateUpper] || stateUpper
  return {
    title: `${stateUpper} Scholarships & Local Foundations — ${total} Verified`,
    description: `${localCount} IRS 990-verified local foundation scholarships in ${fullName}. Find community foundation awards with less competition than national scholarships.`,
    alternates: { canonical: `/local/${params.state}` },
  }
}

export default function StatePage({ params }: { params: { state: string } }) {
  const stateUpper = params.state.toUpperCase()
  const listings = LOCAL_DATA.filter(l => l.state.toUpperCase() === stateUpper)
  if (!listings.length) notFound()

  const stateScholarships = getStateScholarships(stateUpper)
  const fullName = STATE_NAMES[stateUpper] || stateUpper

  // Group foundations by city, preserving order of first appearance
  const cityOrder: string[] = []
  const byCity: Record<string, typeof listings> = {}
  for (const s of listings) {
    if (!byCity[s.city]) {
      cityOrder.push(s.city)
      byCity[s.city] = []
    }
    byCity[s.city].push(s)
  }

  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"48px 20px" }}>

        <div style={{ marginBottom:"24px" }}>
          <Link href="/local" style={{ color:"#2563eb", textDecoration:"none", fontSize:"14px", fontWeight:500 }}>
            ← Back to All States
          </Link>
        </div>

        <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(28px,5vw,36px)", fontWeight:900, color:"#0f172a", marginBottom:"8px", lineHeight:1.2, letterSpacing:"-0.02em" }}>
          {fullName} Scholarships &amp; Local Foundations
        </h1>
        <p style={{ color:"#64748b", fontSize:"16px", marginBottom:"32px" }}>
          {listings.length} IRS 990-verified local foundation{listings.length !== 1 ? "s" : ""}
          {stateScholarships.length > 0 && ` + ${stateScholarships.length} state-specific scholarship${stateScholarships.length !== 1 ? "s" : ""}`}
          {" — "}less competition than national awards
        </p>

        {/* CITY NAV */}
        {cityOrder.length > 1 && (
          <div style={{ marginBottom:40 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
              Jump to City
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {cityOrder.map(city => (
                <a key={city} href={`#city-${citySlug(city)}`}
                  style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8, padding:"6px 14px", fontSize:13, color:"#2563eb", textDecoration:"none", fontWeight:600 }}>
                  {city} ({byCity[city].length})
                </a>
              ))}
            </div>
          </div>
        )}

        {/* LOCAL FOUNDATIONS — grouped by city */}
        <div style={{ display:"flex", flexDirection:"column", gap:"48px", marginBottom: stateScholarships.length > 0 ? "56px" : "0" }}>
          {cityOrder.map(city => (
            <div key={city} id={`city-${citySlug(city)}`}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:"20px", fontWeight:700, color:"#0f172a", margin:0 }}>
                  {city}
                </h2>
                <Link href={`/local/${params.state}/${citySlug(city)}-scholarships`}
                  style={{ fontSize:13, color:"#2563eb", fontWeight:600, textDecoration:"none" }}>
                  All {city} scholarships →
                </Link>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                {byCity[city].map(s => (
                  <div key={s.id} style={{ background:"white", borderRadius:"14px", border:"1px solid #e2e8f0", borderLeft:"3px solid #1a7a4a", padding:"22px 26px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"16px", flexWrap:"wrap" }}>
                      <div style={{ flex:1, minWidth:"200px" }}>
                        <Link href={`/local/${s.state.toLowerCase()}/${s.slug}`} style={{ textDecoration:"none" }}>
                          <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:"17px", fontWeight:700, color:"#0f172a", marginBottom:"6px", marginTop:0 }}>{s.name}</h3>
                        </Link>
                        <p style={{ color:"#475569", fontSize:"14px", marginBottom:"12px", marginTop:0, lineHeight:1.5 }}>{s.eligibility}</p>
                        <div style={{ fontSize:"13px", color:"#64748b" }}>
                          {s.coverage && <span style={{ marginRight:10 }}>📍 {s.coverage}</span>}
                          Deadline: {s.deadline}
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"8px", flexShrink:0 }}>
                        <div style={{ background:"#f0fdf4", color:"#15803d", fontSize:"14px", fontWeight:700, padding:"6px 14px", borderRadius:"999px", border:"1px solid #bbf7d0", whiteSpace:"nowrap" }}>
                          {s.amount}
                        </div>
                        <Link href={`/local/${s.state.toLowerCase()}/${s.slug}`} style={{ fontSize:"13px", color:"#2563eb", fontWeight:600 }}>
                          View details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* STATE-SPECIFIC SCHOLARSHIPS */}
        {stateScholarships.length > 0 && (
          <div>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:"22px", fontWeight:700, color:"#0f172a", marginBottom:"8px" }}>
              Scholarships Open to {fullName} Residents
            </h2>
            <p style={{ color:"#64748b", fontSize:"14px", marginBottom:"20px" }}>
              These scholarships specifically target {fullName} residents or students at {fullName} schools.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              {stateScholarships.map(s => {
                const meta = CAT_META[s.category]
                return (
                  <Link key={s.id} href={`/scholarships/${s.slug}`} style={{ textDecoration:"none" }}>
                    <div style={{ background:"white", borderRadius:"14px", border:"1px solid #e2e8f0", borderLeft:`3px solid ${meta.color}`, padding:"22px 28px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"16px", flexWrap:"wrap" }}>
                        <div style={{ flex:1, minWidth:"200px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                            <span style={{ background:`${meta.color}18`, color:meta.color, fontSize:"11px", fontWeight:700, padding:"2px 10px", borderRadius:"999px", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                              {meta.label}
                            </span>
                            {s.renewable && (
                              <span style={{ background:"#e8f5ee", color:"#1a7a4a", fontSize:"11px", fontWeight:700, padding:"2px 9px", borderRadius:"999px" }}>Renewable</span>
                            )}
                          </div>
                          <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:"18px", fontWeight:700, color:"#0f172a", marginBottom:"6px", marginTop:0 }}>{s.name}</h3>
                          <p style={{ color:"#475569", fontSize:"14px", marginBottom:"10px", marginTop:0, lineHeight:1.5 }}>{s.eligibility}</p>
                          <div style={{ fontSize:"13px", color:"#64748b" }}>
                            {s.deadline && <span>Deadline: {s.deadline}</span>}
                            {s.deadline && s.gpa !== "N/A" && <span style={{ margin:"0 10px" }}>·</span>}
                            {s.gpa !== "N/A" && <span>GPA: {s.gpa}</span>}
                          </div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"8px", flexShrink:0 }}>
                          <div style={{ background:`${meta.color}14`, color:meta.color, fontSize:"15px", fontWeight:800, padding:"6px 14px", borderRadius:"999px", whiteSpace:"nowrap" }}>
                            {s.amount}
                          </div>
                          <span style={{ fontSize:"13px", color:"#2563eb", fontWeight:600 }}>View scholarship</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
