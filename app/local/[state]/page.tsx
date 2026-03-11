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
  const stateName = listings[0].county?.split("/")[0] || stateUpper

  return (
    <main style={{maxWidth:900,margin:"0 auto",padding:"2rem 1rem"}}>
      <Link href="/local" style={{color:"#1a3a6b",fontSize:"0.9rem"}}>â All States</Link>
      <h1 style={{marginTop:"1rem",fontSize:"2rem",fontWeight:700}}>{stateUpper} Local Foundation Scholarships</h1>
      <p style={{color:"#666",marginBottom:"2rem"}}>{listings.length} verified foundation{listings.length>1?"s":""} â all confirmed via IRS 990 filings</p>
      <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
        {listings.map(l => (
          <div key={l.id} style={{border:"1px solid #e2e8f0",borderRadius:12,padding:"1.5rem",background:"#fff"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"0.5rem"}}>
              <h2 style={{fontSize:"1.2rem",fontWeight:600,color:"#0d1f3c",margin:0}}>{l.name}</h2>
              <span style={{background:"#e8f5e9",color:"#2e7d32",padding:"0.25rem 0.75rem",borderRadius:20,fontSize:"0.85rem",fontWeight:600}}>{l.amount}</span>
            </div>
            <p style={{color:"#555",margin:"0.75rem 0",fontSize:"0.95rem"}}>{l.eligibility}</p>
            <div style={{display:"flex",gap:"1rem",flexWrap:"wrap",alignItems:"center"}}>
              <span style={{color:"#666",fontSize:"0.85rem"}}>ð {l.deadline}</span>
              {l.county && <span style={{color:"#666",fontSize:"0.85rem"}}>ð {l.county}</span>}
              <a href={l.url} target="_blank" rel="noopener noreferrer" style={{color:"#1a3a6b",fontSize:"0.85rem",fontWeight:600}}>Apply â</a>
              {l.propublica_url && <a href={l.propublica_url} target="_blank" rel="noopener noreferrer" style={{color:"#666",fontSize:"0.8rem"}}>ð 990 Filing</a>}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
