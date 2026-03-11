import { notFound } from "next/navigation"
import Link from "next/link"
import { LOCAL_DATA } from "@/lib/data"

export function generateStaticParams() {
  return LOCAL_DATA.map(f => ({
    state: f.state.toLowerCase(),
    slug: f.slug,
  }))
}

export async function generateMetadata({ params }: { params: { state: string; slug: string } }) {
  const f = LOCAL_DATA.find(f => f.slug === params.slug)
  if (!f) return {}
  return {
    title: f.name + " Scholarship — " + f.amount + " | Free Money Directory",
    description: f.eligibility + ". Deadline: " + f.deadline + ". Verified via IRS 990 filing.",
  }
}

export default function FoundationPage({ params }: { params: { state: string; slug: string } }) {
  const f = LOCAL_DATA.find(f => f.slug === params.slug)
  if (!f) notFound()

  return (
    <div style={{minHeight:"100vh",background:"#f9fafb"}}>
      <div style={{maxWidth:"800px",margin:"0 auto",padding:"48px 20px"}}>
        <div style={{marginBottom:"24px",display:"flex",gap:"12px"}}>
          <Link href="/local" style={{color:"#2563eb",textDecoration:"none",fontSize:"14px"}}>
            Local Foundations
          </Link>
          <span style={{color:"#94a3b8",fontSize:"14px"}}>/</span>
          <Link href={"/local/" + f.state.toLowerCase()} style={{color:"#2563eb",textDecoration:"none",fontSize:"14px"}}>
            {f.state}
          </Link>
        </div>

        <div style={{background:"white",borderRadius:"16px",border:"1px solid #e2e8f0",padding:"40px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"16px",flexWrap:"wrap",marginBottom:"24px"}}>
            <div>
              <h1 style={{fontSize:"28px",fontWeight:800,color:"#0f172a",marginBottom:"8px",marginTop:0}}>{f.name}</h1>
              <span style={{background:"#f0fdf4",color:"#15803d",fontSize:"14px",fontWeight:700,padding:"4px 12px",borderRadius:"999px",border:"1px solid #bbf7d0"}}>
                {f.amount}
              </span>
            </div>
          </div>

          <div style={{borderTop:"1px solid #f1f5f9",paddingTop:"24px",display:"grid",gap:"16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
              <div style={{background:"#f8fafc",borderRadius:"10px",padding:"16px"}}>
                <div style={{fontSize:"12px",color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"4px"}}>Deadline</div>
                <div style={{fontSize:"16px",fontWeight:600,color:"#0f172a"}}>{f.deadline}</div>
              </div>
              <div style={{background:"#f8fafc",borderRadius:"10px",padding:"16px"}}>
                <div style={{fontSize:"12px",color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"4px"}}>Location</div>
                <div style={{fontSize:"16px",fontWeight:600,color:"#0f172a"}}>{f.city}, {f.state}</div>
              </div>
            </div>

            <div style={{background:"#f8fafc",borderRadius:"10px",padding:"16px"}}>
              <div style={{fontSize:"12px",color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"8px"}}>Eligibility</div>
              <div style={{fontSize:"15px",color:"#334155",lineHeight:1.6}}>{f.eligibility}</div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginTop:"8px"}}>
              
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{display:"block",background:"#2563eb",color:"white",textAlign:"center",padding:"14px",borderRadius:"10px",textDecoration:"none",fontWeight:700,fontSize:"15px"}}
              >
                Apply Now
              </a>
              
                href={f.propublica_url || f.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{display:"block",background:"#f8fafc",color:"#475569",textAlign:"center",padding:"14px",borderRadius:"10px",textDecoration:"none",fontWeight:600,fontSize:"15px",border:"1px solid #e2e8f0"}}
              >
                View 990 Filing
              </a>
            </div>
          </div>

          <div style={{marginTop:"24px",padding:"16px",background:"#fffbeb",borderRadius:"10px",border:"1px solid #fde68a"}}>
            <p style={{margin:0,fontSize:"13px",color:"#92400e",lineHeight:1.6}}>
              <strong>Note:</strong> This foundation was identified via IRS 990 filings. Click Apply Now to visit their ProPublica page which includes contact info and website. Verify all deadlines and eligibility directly with the foundation before applying.
            </p>
          </div>
        </div>

        <div style={{marginTop:"24px",textAlign:"center"}}>
          <Link href={"/local/" + f.state.toLowerCase()} style={{color:"#2563eb",textDecoration:"none",fontSize:"14px"}}>
            See all {f.state} foundations &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
