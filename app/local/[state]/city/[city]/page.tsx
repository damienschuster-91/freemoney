import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { LOCAL_DATA } from "@/lib/data"
import { SITE_NAME } from "@/lib/utils"

function citySlug(city: string) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function generateStaticParams() {
  const seen = new Set<string>()
  const params: { state: string; city: string }[] = []
  LOCAL_DATA.forEach(s => {
    const key = `${s.state.toLowerCase()}-${citySlug(s.city)}`
    if (!seen.has(key)) { seen.add(key); params.push({ state: s.state.toLowerCase(), city: citySlug(s.city) }) }
  })
  return params
}

export async function generateMetadata({ params }: { params: { state: string; city: string } }): Promise<Metadata> {
  const stateUpper = params.state.toUpperCase()
  const listings = LOCAL_DATA.filter(s => s.state.toUpperCase() === stateUpper && citySlug(s.city) === params.city)
  if (!listings.length) return {}
  const cityName = listings[0].city
  return {
    title: `${cityName} Scholarships — ${listings.length} Local Foundations | ${SITE_NAME}`,
    description: `${listings.length} IRS 990-verified local foundation scholarships in ${cityName}, ${stateUpper}. Less competition than national awards.`,
    alternates: { canonical: `/local/${params.state}/city/${params.city}` },
  }
}

export default function CityPage({ params }: { params: { state: string; city: string } }) {
  const stateUpper = params.state.toUpperCase()
  const listings = LOCAL_DATA.filter(s => s.state.toUpperCase() === stateUpper && citySlug(s.city) === params.city)
  if (!listings.length) notFound()
  const cityName = listings[0].city
  const otherCities = [...new Set(LOCAL_DATA.filter(s => s.state.toUpperCase() === stateUpper && citySlug(s.city) !== params.city).map(s => s.city))].slice(0, 6)
  return (
    <div style={{ minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"48px 20px" }}>
        <div style={{ display:"flex", gap:8, fontSize:13, color:"#64748b", marginBottom:24, alignItems:"center", flexWrap:"wrap" }}>
          <Link href="/" style={{ color:"#2563eb", textDecoration:"none" }}>Home</Link>
          <span>›</span>
          <Link href="/local" style={{ color:"#2563eb", textDecoration:"none" }}>Local</Link>
          <span>›</span>
          <Link href={`/local/${params.state}`} style={{ color:"#2563eb", textDecoration:"none" }}>{stateUpper}</Link>
          <span>›</span>
          <span style={{ color:"#0f172a", fontWeight:600 }}>{cityName}</span>
        </div>
        <h1 style={{ fontSize:32, fontWeight:800, color:"#0f172a", marginBottom:8, lineHeight:1.2 }}>
          📍 {cityName} Scholarships
        </h1>
        <p style={{ color:"#64748b", fontSize:16, marginBottom:40 }}>
          {listings.length} IRS 990-verified foundation{listings.length !== 1 ? "s" : ""} in {cityName}, {stateUpper} — less competition than national awards
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {listings.map(s => (
            <Link key={s.id} href={`/local/${s.state.toLowerCase()}/${s.slug}`} style={{ textDecoration:"none" }}>
              <div style={{ background:"white", borderRadius:14, border:"1px solid #e2e8f0", padding:"24px 28px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <h2 style={{ fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:6, marginTop:0 }}>{s.name}</h2>
                    <p style={{ color:"#475569", fontSize:14, marginBottom:14, marginTop:0, lineHeight:1.5 }}>{s.eligibility}</p>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:13, color:"#64748b" }}>
                      <span>📅 {s.deadline}</span><span>📍 {s.city}, {s.state}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
                    <div style={{ background:"#f0fdf4", color:"#15803d", fontSize:14, fontWeight:700, padding:"6px 14px", borderRadius:999, border:"1px solid #bbf7d0", whiteSpace:"nowrap" }}>{s.amount}</div>
                    <span style={{ fontSize:13, color:"#2563eb", fontWeight:600 }}>View details →</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {otherCities.length > 0 && (
          <div style={{ marginTop:48 }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Other {stateUpper} Cities</h2>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {otherCities.map(city => (
                <Link key={city} href={`/local/${params.state}/city/${citySlug(city)}`} style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:10, padding:"8px 16px", fontSize:14, color:"#2563eb", textDecoration:"none", fontWeight:500 }}>{city} →</Link>
              ))}
              <Link href={`/local/${params.state}`} style={{ background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:10, padding:"8px 16px", fontSize:14, color:"#1d4ed8", textDecoration:"none", fontWeight:600 }}>All {stateUpper} →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
