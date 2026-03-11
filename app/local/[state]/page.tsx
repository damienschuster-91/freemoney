import { notFound } from "next/navigation"
import Link from "next/link"
import { LOCAL_DATA } from "@/lib/data"

export function generateStaticParams() {
  const states = Array.from(new Set(LOCAL_DATA.map(l => l.state.toUpperCase())))
  return states.map(state => ({ state: state.toLowerCase() }))
}

export async function generateMetadata({ params }: { params: { state: string } }) {
  const stateUpper = params.state.toUpperCase()
  const count = LOCAL_DATA.filter(l => l.state.toUpperCase() === stateUpper).length
  return {
    title: `${stateUpper} Local Foundation Scholarships — ${count} Verified`,
    description: `${count} IRS 990-verified local foundation scholarships in ${stateUpper}. Less competition than national awards.`,
  }
}

export default function StatePage({ params }: { params: { state: string } }) {
  const stateUpper = params.state.toUpperCase()
  const listings = LOCAL_DATA.filter(l => l.state.toUpperCase() === stateUpper)
  if (!listings.length) notFound()

  return (
    <div style={{minHeight:"100vh", background:"#f9fafb"}}>
      <div style={{maxWidth:"860px", margin:"0 auto", padding:"48px 20px"}}>

        <div style={{marginBottom:"24px"}}>
          <Link href="/local" style={{color:"#2563eb", textDecoration:"none", fontSize:"14px", fontWeight:500}}>
            &larr; All States
          </Link>
        </div>

        <h1 style={{fontSize:"32px", fontWeight:"800", color:"#0f172a", marginBottom:"8px", lineHeight:1.2}}>
          {stateUpper} Local Foundation Scholarships
        </h1>
        <p style={{color:"#64748b", fontSize:"16px", marginBottom:"40px"}}>
          {listings.length} IRS 990-verified foundation{listings.length !== 1 ? "s" : ""} &mdash; less competition than national awards
        </p>

        <div style={{display:"flex", flexDirection:"column", gap:"16px"}}>
          {listings.map(s => (
            <div key={s.id} style={{
              background:"white",
              borderRadius:"14px",
              border:"1px solid #e2e8f0",
              padding:"24px 28px",
              boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
              transition:"box-shadow 0.2s"
            }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"16px", flexWrap:"wrap"}}>
                <div style={{flex:1, minWidth:"200px"}}>
                  <h2 style={{fontSize:"18px", fontWeight:"700", color:"#0f172a", marginBottom:"6px", marginTop:0}}>
                    {s.name}
                  </h2>
                  <p style={{color:"#475569", fontSize:"14px", marginBottom:"14px", marginTop:0, lineHeight:1.5}}>
                    {s.eligibility}
                  </p>
                  <div style={{display:"flex", gap:"20px", flexWrap:"wrap", alignItems:"center"}}>
                    <span style={{fontSize:"13px", color:"#64748b"}}>
                      <strong style={{color:"#334155"}}>Deadline:</strong> {s.deadline}
                    </span>
                    <span style={{fontSize:"13px", color:"#64748b"}}>
                      <strong style={{color:"#334155"}}>Location:</strong> {s.city}
                    </span>
                    
                      href={s.propublica_url || s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize:"13px",
                        fontWeight:"600",
                        color:"white",
                        background:"#2563eb",
                        padding:"5px 14px",
                        borderRadius:"6px",
                        textDecoration:"none"
                      }}
                    >
                      View Foundation
                    </a>
                  </div>
                </div>
                <div style={{
                  background:"#f0fdf4",
                  color:"#15803d",
                  fontSize:"14px",
                  fontWeight:"700",
                  padding:"6px 14px",
                  borderRadius:"999px",
                  border:"1px solid #bbf7d0",
                  whiteSpace:"nowrap",
                  flexShrink:0
                }}>
                  {s.amount}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop:"48px", padding:"24px", background:"#eff6ff", borderRadius:"12px", border:"1px solid #bfdbfe"}}>
          <p style={{margin:0, fontSize:"14px", color:"#1e40af", lineHeight:1.6}}>
            <strong>How to apply:</strong> Click &quot;View Foundation&quot; on any listing above to see their IRS 990 filing on ProPublica, which includes contact information and website links. Then visit the foundation&apos;s website directly to find their scholarship application.
          </p>
        </div>

      </div>
    </div>
  )
}
