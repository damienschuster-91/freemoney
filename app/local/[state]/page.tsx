import { notFound } from "next/navigation"
import Link from "next/link"
import { LOCAL_DATA } from "@/lib/data"

export function generateStaticParams() {
  const states = Array.from(new Set(LOCAL_DATA.map(l => l.state.toLowerCase())))
  return states.map(state => ({ state }))
}

export default function StatePage({ params }: { params: { state: string } }) {
  const stateUpper = params.state.toUpperCase()
  const listings = LOCAL_DATA.filter(l => l.state.toUpperCase() === stateUpper)
  if (!listings.length) notFound()

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb",padding:"48px 16px"}}>
      <div style={{maxWidth:"800px",margin:"0 auto"}}>
        <div style={{marginBottom:"24px"}}>
          <Link href="/local" style={{color:"#2563eb",textDecoration:"none",fontSize:"14px"}}>
            &larr; All States
          </Link>
        </div>
        <h1 style={{fontSize:"28px",fontWeight:"700",color:"#111827",marginBottom:"8px"}}>
          {stateUpper} Local Foundation Scholarships
        </h1>
        <p style={{color:"#6b7280",marginBottom:"32px"}}>
          {listings.length} verified foundation{listings.length !== 1 ? "s" : ""} &mdash; all confirmed via IRS 990 filings
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
          {listings.map(s => (
            <div key={s.id} style={{background:"white",borderRadius:"12px",border:"1px solid #e5e7eb",padding:"24px",boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"16px"}}>
                <div style={{flex:1}}>
                  <h2 style={{fontSize:"17px",fontWeight:"600",color:"#111827",marginBottom:"6px"}}>{s.name}</h2>
                  <p style={{color:"#4b5563",fontSize:"14px",marginBottom:"12px"}}>{s.eligibility}</p>
                  <div style={{display:"flex",gap:"16px",flexWrap:"wrap",fontSize:"13px",color:"#6b7280"}}>
                    <span>Deadline: {s.deadline}</span>
                    <span>Location: {s.city}</span>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{color:"#1d4ed8",fontWeight:"600",textDecoration:"none"}}>Apply</a>
                    {s.propublica_url && (
                      <a href={s.propublica_url} target="_blank" rel="noopener noreferrer" style={{color:"#9ca3af",textDecoration:"none"}}>990 Filing</a>
                    )}
                  </div>
                </div>
                <div style={{background:"#f0fdf4",color:"#15803d",fontSize:"13px",fontWeight:"600",padding:"4px 12px",borderRadius:"999px",border:"1px solid #bbf7d0",whiteSpace:"nowrap"}}>
                  {s.amount}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
