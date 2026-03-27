"use client"
import { useState, useMemo, Suspense } from "react"
import Link from "next/link"
import type { Scholarship } from "@/lib/data"
import { CAT_META } from "@/lib/data"

const TRADE_TAGS = [
  "electrical", "welding", "HVAC", "plumbing", "construction",
  "automotive", "manufacturing", "veteran",
]

function TradesClientInner({ scholarships }: { scholarships: Scholarship[] }) {
  const [search, setSearch] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [sort, setSort] = useState("name")

  const toggleTag = (t: string) => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])

  const filtered = useMemo(() => {
    return scholarships.filter(s => {
      if (search) {
        const q = search.toLowerCase()
        if (!s.name.toLowerCase().includes(q) &&
            !s.eligibility.toLowerCase().includes(q) &&
            !s.tags.some(t => t.toLowerCase().includes(q))) return false
      }
      if (tags.length && !tags.every(t => s.tags.map(x => x.toLowerCase()).includes(t.toLowerCase()))) return false
      return true
    }).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : a.deadline.localeCompare(b.deadline))
  }, [scholarships, search, tags, sort])

  const meta = CAT_META["trade"]

  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ padding: "40px 24px 48px", background: "linear-gradient(135deg, #1a2e1a 0%, #2d5a1b 100%)" }}>
        <div className="hero-inner">
          <div className="hero-badge">🔧 Verified Trade Opportunities</div>
          <h1 style={{ marginBottom: 10 }}>Trade School<br/><span>Scholarships & Apprenticeships</span></h1>
          <p className="hero-sub" style={{ marginBottom: 24 }}>
            {scholarships.length}+ verified scholarships, grants, and paid apprenticeships for electricians, welders, HVAC, plumbing, construction, and more.
          </p>
          <div className="hero-search-wrap">
            <span className="hero-search-icon">🔍</span>
            <input
              className="hero-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by trade, program, or keyword…"
            />
            {search && <button className="hero-clear" onClick={() => setSearch("")}>✕</button>}
          </div>
        </div>
      </section>

      <div className="page-wrap">
        {/* Trade tag filters */}
        <div className="tag-filter-row">
          <span className="tag-filter-label">Trade:</span>
          {TRADE_TAGS.map(t => (
            <span
              key={t}
              className={`tag-filter-chip${tags.includes(t) ? " active" : ""}`}
              onClick={() => toggleTag(t)}
            >{t}</span>
          ))}
          {tags.length > 0 && (
            <span onClick={() => setTags([])} style={{ fontSize: 12, color: "#e85d26", cursor: "pointer", fontWeight: 700, marginLeft: 4 }}>✕ clear</span>
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
          {filtered.map((s, i) => (
            <Link
              key={s.id}
              href={`/scholarships/${s.slug}`}
              className="card fade-up"
              style={{ animationDelay: `${Math.min(i, 20) * 0.03}s` }}
            >
              <div className="card-accent" style={{ background: `linear-gradient(90deg,${meta.color},${meta.color}88)` }} />
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span className="card-cat" style={{ color: meta.color, background: `${meta.color}14` }}>
                    {meta.icon} {meta.label}
                  </span>
                  {s.renewable && <span className="renewable-badge">↺ Renewable</span>}
                </div>
                <div className="card-name">{s.name}</div>
                <div className="card-amount">{s.amount}</div>
                <p className="card-elig">{s.eligibility}</p>
                <div className="card-tags">
                  {s.tags.slice(0, 3).map(t => <span key={t} className="tag-chip">{t}</span>)}
                </div>
                <div className="card-footer">
                  <div className="card-meta">
                    {s.deadline && <span>📅 {s.deadline}</span>}
                    {s.gpa && s.gpa !== "N/A" && <span>GPA {s.gpa}</span>}
                  </div>
                  <span className="card-cta">View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-emoji">🔧</div>
            <div className="empty-text">No results — try adjusting your filters.</div>
            {tags.length > 0 && (
              <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => setTags([])}>Clear filters</button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function TradesClient(props: { scholarships: Scholarship[] }) {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <TradesClientInner {...props} />
    </Suspense>
  )
}
