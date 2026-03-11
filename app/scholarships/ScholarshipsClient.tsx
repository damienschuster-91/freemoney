"use client"
import { useState, useMemo, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { Scholarship } from "@/lib/data"
import { CAT_META, ALL_TAGS } from "@/lib/data"

const CATS = [
  { id: "all",        label: "All",                     icon: "✦" },
  { id: "scholarship",label: "Scholarships",            icon: "🎓" },
  { id: "grant",      label: "Grants",                  icon: "💸" },
  { id: "trade",      label: "Trades",                  icon: "🔧" },
  { id: "other",      label: "Contests & Easy Apply",   icon: "🎯" },
]

function ScholarshipsClientInner({
  scholarships,
  total,
}: {
  scholarships: Scholarship[]
  total: number
}) {
  const params = useSearchParams()
  const [search, setSearch] = useState(params.get("q") || "")
  const [cat, setCat] = useState(params.get("cat") || "all")
  const [tags, setTags] = useState<string[]>(params.get("tag") ? [params.get("tag")!] : [])
  const [sort, setSort] = useState("name")

  const toggleTag = (t: string) => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])

  const filtered = useMemo(() => {
    return scholarships.filter(s => {
      if (cat !== "all" && s.category !== cat) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) &&
            !s.eligibility.toLowerCase().includes(q) &&
            !s.tags.some(t => t.toLowerCase().includes(q))) return false
      }
      if (tags.length && !tags.every(t => s.tags.includes(t))) return false
      return true
    }).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : a.deadline.localeCompare(b.deadline))
  }, [scholarships, cat, search, tags, sort])

  return (
    <>
      {/* Hero */}
      <section className="hero" style={{padding:"40px 24px 48px"}}>
        <div className="hero-inner">
          <h1 style={{marginBottom:10}}>Find Your<br/><span>Free Money</span></h1>
          <p className="hero-sub" style={{marginBottom:24}}>{total}+ opportunities. Filter to find yours.</p>
          <div className="hero-search-wrap">
            <span className="hero-search-icon">🔍</span>
            <input
              className="hero-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, keyword, or eligibility…"
            />
            {search && <button className="hero-clear" onClick={() => setSearch("")}>✕</button>}
          </div>
        </div>
      </section>

      <div className="page-wrap">
        {/* Cat filter */}
        <div className="filter-bar">
          {CATS.map(c => (
            <button
              key={c.id}
              className={`pill${cat === c.id ? " active" : ""}`}
              onClick={() => setCat(c.id)}
              style={cat === c.id ? {background: c.id==="all" ? "#1a3a6b" : CAT_META[c.id]?.color || "#1a3a6b", borderColor:"transparent"} : {}}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Tag filters */}
        <div className="tag-filter-row">
          <span className="tag-filter-label">Filter:</span>
          {ALL_TAGS.map(t => (
            <span
              key={t}
              className={`tag-filter-chip${tags.includes(t) ? " active" : ""}`}
              onClick={() => toggleTag(t)}
            >{t}</span>
          ))}
          {tags.length > 0 && (
            <span onClick={() => setTags([])} style={{fontSize:12,color:"#e85d26",cursor:"pointer",fontWeight:700,marginLeft:4}}>✕ clear</span>
          )}
        </div>

        {/* Results bar */}
        <div className="results-bar">
          <span className="results-count">
            <strong>{filtered.length}</strong> results
            {(search || tags.length > 0) && " for your search"}
          </span>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="name">A–Z</option>
            <option value="deadline">By Deadline</option>
          </select>
        </div>

        {/* Grid */}
        <div className="card-grid">
          {filtered.map((s, i) => {
            const meta = CAT_META[s.category]
            return (
              <Link
                key={s.id}
                href={`/scholarships/${s.slug}`}
                className="card fade-up"
                style={{animationDelay:`${Math.min(i,20)*0.03}s`}}
              >
                <div className="card-accent" style={{background:`linear-gradient(90deg,${meta.color},${meta.color}88)`}} />
                <div className="card-body">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <span className="card-cat" style={{color:meta.color,background:`${meta.color}14`}}>
                      {meta.icon} {meta.label}
                    </span>
                    {s.renewable && <span className="renewable-badge">↺ Renewable</span>}
                  </div>
                  <div className="card-name">{s.name}</div>
                  <div className="card-amount">{s.amount}</div>
                  <p className="card-elig">{s.eligibility}</p>
                  <div className="card-tags">
                    {s.tags.slice(0,3).map(t => <span key={t} className="tag-chip">{t}</span>)}
                  </div>
                  <div className="card-footer">
                    <div className="card-meta">
                      {s.deadline && <span>📅 {s.deadline}</span>}
                      {s.gpa && <span>GPA {s.gpa}</span>}
                    </div>
                    <span className="card-cta">View →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">¯\_(ツ)_/¯</div>
            <div className="empty-text">No results — try adjusting your filters.</div>
            {tags.length > 0 && (
              <button className="btn-ghost" style={{marginTop:12}} onClick={() => setTags([])}>Clear filters</button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function ScholarshipsClient(props: Parameters<typeof ScholarshipsClientInner>[0]) {
  return (
    <Suspense fallback={<div style={{padding:"2rem",textAlign:"center"}}>Loading...</div>}>
      <ScholarshipsClientInner {...props} />
    </Suspense>
  )
}
