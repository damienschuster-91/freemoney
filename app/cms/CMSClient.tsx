"use client"

import { useState, useEffect, useMemo } from "react"
import { SCHOLARSHIPS } from "@/lib/data"

// --- TYPES -------------------------------------------------------------------

type Status = "pending" | "approved" | "rejected"

interface Foundation {
  ein: string
  name: string
  state: string
  city: string
  county?: string
  amount?: string
  deadline?: string
  eligibility?: string
  url?: string
  propublica_url?: string
  ntee_code?: string
  grants_paid?: number
  revenue_raw?: number
  latest_year?: number
  tags?: string[]
  notes?: string
  _status: Status
  _imported_at?: string
  _approved_at?: string
  _score?: number
  slug?: string
  id?: string
}

interface BlogPost {
  id: string
  scholarship_id: number
  name: string
  amount: string
  deadline?: string
  url: string
  tags: string[]
  category: string
  eligibility: string
  status: "draft" | "written" | "published"
  notes: string
  blog_url: string
  created_at: string
}

interface ImportMeta {
  imported_at: string
  new_added: number
  dupes_skipped: number
  states: string[]
}

// --- STORAGE HOOK ------------------------------------------------------------

function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void, boolean] {
  const [data, setData] = useState<T>(defaultValue)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) setData(JSON.parse(stored))
    } catch {}
    setReady(true)
  }, [key])

  const save = (next: T) => {
    setData(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
  }

  return [data, save, ready]
}

// --- BLOG SEED ---------------------------------------------------------------

const BLOG_SEED: BlogPost[] = SCHOLARSHIPS.slice(0, 60).map(s => ({
  id: `blog-${s.id}`,
  scholarship_id: s.id,
  name: s.name,
  amount: s.amount,
  deadline: s.deadline,
  url: s.url,
  tags: s.tags,
  category: s.category,
  eligibility: s.eligibility,
  status: "draft",
  notes: "",
  blog_url: "",
  created_at: new Date().toISOString(),
}))

const CAT_COLOR: Record<string, string> = {
  scholarship: "#1a3a6b",
  grant: "#0f6eb4",
  trade: "#e85d26",
  other: "#6b3fa0",
  local: "#1a7a4a",
}
const CAT_ICON: Record<string, string> = {
  scholarship: "[S]", grant: "[G]", trade: "[T]", other: "[O]", local: "[L]",
}

// --- MAIN CMS ----------------------------------------------------------------

export default function CMSClient() {
  const [mainTab, setMainTab] = useState<"foundations" | "blog">("foundations")

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb" }}>
      {/* CMS Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)",
        padding: "32px 24px 0",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 100, padding: "4px 14px", marginBottom: 14,
            fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            [CMS] Internal Tool — Not Indexed
          </div>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 900, color: "#fff",
            lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 20,
          }}>
            Free Money <span style={{ color: "#7eb8f7" }}>CMS</span>
          </h1>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.08)", padding: 4, borderRadius: 12, width: "fit-content" }}>
            {[
              { id: "foundations" as const, label: "Foundation Queue" },
              { id: "blog" as const, label: "Blog Tracker" },
            ].map(t => (
              <button key={t.id} onClick={() => setMainTab(t.id)} style={{
                padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
                background: mainTab === t.id ? "#fff" : "transparent",
                color: mainTab === t.id ? "#0d1f3c" : "rgba(255,255,255,0.6)",
                boxShadow: mainTab === t.id ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.15s",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 60px" }}>
        {mainTab === "foundations" && <FoundationQueue />}
        {mainTab === "blog" && <BlogTracker />}
      </div>
    </div>
  )
}

// --- FOUNDATION QUEUE --------------------------------------------------------

function FoundationQueue() {
  const [pending,  setPending,  pendingReady]  = useLocalStorage<Foundation[]>("cms:pending",  [])
  const [approved, setApproved, approvedReady] = useLocalStorage<Foundation[]>("cms:approved", [])
  const [rejected, setRejected, rejectedReady] = useLocalStorage<Foundation[]>("cms:rejected", [])
  const [meta,     setMeta]                    = useLocalStorage<ImportMeta[]>("cms:meta",      [])

  const [tab,       setTab]       = useState<Status>("pending")
  const [importTxt, setImportTxt] = useState("")
  const [importMsg, setImportMsg] = useState<{ type: "ok" | "warn" | "err"; text: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [draft,     setDraft]     = useState<Partial<Foundation>>({})
  const [tagsStr,   setTagsStr]   = useState("")
  const [expandId,  setExpandId]  = useState<string | null>(null)

  const ready = pendingReady && approvedReady && rejectedReady

  const approve = (item: Foundation) => {
    setApproved([...approved.filter(x => x.ein !== item.ein), {
      ...item, slug: "cms-" + item.ein, id: "cms-" + item.ein,
      _status: "approved", _approved_at: new Date().toISOString(),
    }])
    setPending(pending.filter(x => x.ein !== item.ein))
  }

  const reject = (item: Foundation) => {
    setRejected([...rejected.filter(x => x.ein !== item.ein), { ...item, _status: "rejected" }])
    setPending(pending.filter(x => x.ein !== item.ein))
  }

  const unapprove = (item: Foundation) => {
    setApproved(approved.filter(x => x.ein !== item.ein))
    setPending([...pending, { ...item, _status: "pending" }])
  }

  const restore = (item: Foundation) => {
    setRejected(rejected.filter(x => x.ein !== item.ein))
    setPending([...pending, { ...item, _status: "pending" }])
  }

  const startEdit = (item: Foundation) => {
    setEditId(item.ein)
    setTagsStr((item.tags ?? []).join(", "))
    setDraft({
      name: item.name, amount: item.amount, deadline: item.deadline ?? "",
      eligibility: item.eligibility, url: item.url ?? "",
      county: item.county ?? "", notes: item.notes ?? "",
    })
  }

  const saveEdit = (item: Foundation) => {
    const updated = {
      ...item, ...draft,
      tags: tagsStr.split(",").map(t => t.trim()).filter(Boolean),
    }
    if (item._status === "approved") setApproved(approved.map(x => x.ein === item.ein ? updated : x))
    else setPending(pending.map(x => x.ein === item.ein ? updated : x))
    setEditId(null)
  }

  const handleImport = async () => {
    setImporting(true); setImportMsg(null)
    try {
      const parsed = JSON.parse(importTxt.trim())
      const items: Foundation[] = parsed.listings ?? (Array.isArray(parsed) ? parsed : [parsed])
      if (!items.length) throw new Error("No listings found")
      const known = new Set([...pending, ...approved, ...rejected].map(x => x.ein))
      const fresh = items.filter(l => l.ein && !known.has(l.ein))
      const dupes = items.length - fresh.length
      if (!fresh.length) {
        setImportMsg({ type: "warn", text: `All ${items.length} already in CMS (${dupes} dupes).` })
        setImporting(false); return
      }
      setPending([...pending, ...fresh.map(l => ({ ...l, _status: "pending" as const, _imported_at: new Date().toISOString() }))])
      setMeta([...meta, { imported_at: new Date().toISOString(), new_added: fresh.length, dupes_skipped: dupes, states: parsed.meta?.states_scraped ?? [] }])
      setImportMsg({ type: "ok", text: `Imported ${fresh.length} listings${dupes ? ` (${dupes} dupes skipped)` : ""}.` })
      setImportTxt("")
    } catch (e: unknown) {
      setImportMsg({ type: "err", text: `Error: ${e instanceof Error ? e.message : String(e)}` })
    }
    setImporting(false)
  }

  const exportApproved = () => {
    const json = JSON.stringify({ exported_at: new Date().toISOString(), count: approved.length, listings: approved }, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob)
    a.download = "approved-foundations.json"; a.click()
  }

  const current = tab === "pending" ? pending : tab === "approved" ? approved : rejected

  const S = {
    label: { fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#8a9abb", marginBottom: 5 },
    input: { width: "100%", background: "#f8faff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: "9px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500 },
    card: { background: "#fff", border: "1.5px solid #e8edf5", borderRadius: 14, overflow: "hidden" as const },
  }

  if (!ready) return <div style={{ padding: "60px 0", textAlign: "center", color: "#8a9abb" }}>Loading...</div>

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        {([
          { label: "Pending Review", count: pending.length, color: "#e85d26", t: "pending" },
          { label: "Approved / Live", count: approved.length, color: "#1a7a4a", t: "approved" },
          { label: "Rejected", count: rejected.length, color: "#8a9abb", t: "rejected" },
        ] as const).map(s => (
          <div key={s.t} onClick={() => setTab(s.t)} style={{
            background: "#fff", border: `2px solid ${tab === s.t ? s.color : "#e8edf5"}`,
            borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Fraunces', serif" }}>{s.count}</div>
            <div style={{ fontSize: 12, color: "#8a9abb", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Import panel */}
      <details style={{ marginBottom: 22 }}>
        <summary style={{
          cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#5a6a8a",
          padding: "11px 16px", background: "#fff", borderRadius: 12, border: "1.5px solid #e8edf5",
          listStyle: "none", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: "#1a3a6b", fontSize: 16 }}>+</span> Import Scraper Results
        </summary>
        <div style={{ background: "#fff", border: "1.5px solid #e8edf5", borderTop: "none", borderRadius: "0 0 12px 12px", padding: 16 }}>
          <p style={{ fontSize: 12, color: "#8a9abb", marginBottom: 10, lineHeight: 1.7 }}>
            Run <code style={{ background: "#f4f6fb", padding: "2px 6px", borderRadius: 4, color: "#1a3a6b", fontWeight: 700 }}>node 990-scraper-agent.js TX CA NY</code> then paste the JSON below.
          </p>
          <textarea
            value={importTxt} onChange={e => setImportTxt(e.target.value)}
            placeholder={'{ "meta": {...}, "listings": [...] }'}
            style={{ width: "100%", height: 90, background: "#f8faff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: 12, borderRadius: 8, fontSize: 13, fontFamily: "monospace", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
            <button
              onClick={handleImport} disabled={!importTxt.trim() || importing}
              className="btn-primary"
              style={{ background: importTxt.trim() ? "#1a3a6b" : "#c5cde0", cursor: importTxt.trim() ? "pointer" : "default" }}
            >
              {importing ? "Importing..." : "Import"}
            </button>
            {importMsg && (
              <span style={{ fontSize: 13, fontWeight: 600, color: { ok: "#1a7a4a", warn: "#b87a00", err: "#c0392b" }[importMsg.type] }}>
                {importMsg.text}
              </span>
            )}
          </div>
        </div>
      </details>

      {/* Import history */}
      {meta.length > 0 && (
        <div style={{ background: "#f0fbf5", border: "1.5px solid #c5e8d5", borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#3a7a55", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Import History</div>
          {[...meta].reverse().slice(0, 4).map((m, i) => (
            <div key={i} style={{ fontSize: 13, color: "#5a8a6a", lineHeight: 1.9, fontWeight: 500 }}>
              &gt; {new Date(m.imported_at).toLocaleDateString()} — <strong style={{ color: "#0d2e1a" }}>{m.new_added}</strong> new
              {m.states?.length > 0 && <span style={{ color: "#8aa89a" }}> ({m.states.slice(0, 6).join(", ")}{m.states.length > 6 ? "..." : ""})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "#8a9abb", fontWeight: 500 }}>
          <span style={{ color: "#1a3a6b", fontWeight: 800 }}>{current.length}</span> {tab} listing{current.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "approved" && approved.length > 0 && (
            <button onClick={exportApproved} className="btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }}>
              Export JSON
            </button>
          )}
          {tab === "rejected" && rejected.length > 0 && (
            <button
              className="btn-ghost" style={{ fontSize: 12, padding: "5px 12px", color: "#c0392b", borderColor: "#f5c5c5" }}
              onClick={() => { if (window.confirm("Clear all rejected?")) setRejected([]) }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {current.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#8a9abb", fontSize: 14 }}>
          {tab === "pending" ? "No listings pending. Run the scraper and import above."
            : tab === "approved" ? "No approved listings yet."
              : "No rejected listings."}
        </div>
      )}

      {/* Listings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {current.map(item => {
          const isEditing = editId === item.ein
          const isExpanded = expandId === item.ein
          const tabCol = { pending: "#e85d26", approved: "#1a7a4a", rejected: "#8a9abb" }[tab]

          return (
            <div key={item.ein} style={{ ...S.card, borderLeft: `4px solid ${tabCol}` }}>
              <div style={{ padding: "16px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, background: "#f4f6fb", color: "#5a6a8a", padding: "2px 9px", borderRadius: 100 }}>
                      {item.state} / {item.city}
                    </span>
                    {item.ntee_code === "B82" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#1a7a4a", background: "#e8f5ee", padding: "2px 8px", borderRadius: 100 }}>B82 Scholarship</span>
                    )}
                    <span style={{ fontSize: 10, color: "#c5cde0", fontWeight: 500 }}>EIN: {item.ein}</span>
                  </div>

                  {isEditing
                    ? <input value={String(draft.name ?? "")} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                      style={{ ...S.input, fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }} />
                    : <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: "#0d1f3c", marginBottom: 5, lineHeight: 1.3 }}>{item.name}</div>
                  }

                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "#8a9abb", fontWeight: 500 }}><strong style={{ color: "#1a3a6b" }}>${(item.grants_paid ?? 0).toLocaleString()}</strong> grants paid</span>
                    <span style={{ fontSize: 13, color: "#8a9abb", fontWeight: 500 }}>yr. {item.latest_year}</span>
                    {item._score && <span style={{ fontSize: 13, color: "#8a9abb", fontWeight: 500 }}>* score {item._score}</span>}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {tab === "pending" && !isEditing && (<>
                    <button onClick={() => approve(item)} className="btn-primary" style={{ padding: "7px 14px", fontSize: 12, background: "#1a7a4a" }}>Approve</button>
                    <button onClick={() => startEdit(item)} className="btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }}>Edit</button>
                    <button onClick={() => reject(item)} className="btn-ghost" style={{ padding: "7px 12px", fontSize: 12, color: "#c0392b", borderColor: "#f5c5c5" }}>X</button>
                  </>)}
                  {tab === "pending" && isEditing && (<>
                    <button onClick={() => saveEdit(item)} className="btn-primary" style={{ padding: "7px 14px", fontSize: 12, background: "#1a7a4a" }}>Save</button>
                    <button onClick={() => setEditId(null)} className="btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }}>Cancel</button>
                  </>)}
                  {tab === "approved" && (<>
                    <button onClick={() => startEdit(item)} className="btn-ghost" style={{ padding: "7px 10px", fontSize: 12 }}>Edit</button>
                    <button onClick={() => unapprove(item)} className="btn-ghost" style={{ padding: "7px 10px", fontSize: 11 }}>Unpublish</button>
                  </>)}
                  {tab === "approved" && isEditing && (<>
                    <button onClick={() => saveEdit(item)} className="btn-primary" style={{ padding: "7px 14px", fontSize: 12, background: "#1a7a4a" }}>Save</button>
                    <button onClick={() => setEditId(null)} className="btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }}>Cancel</button>
                  </>)}
                  {tab === "rejected" && <button onClick={() => restore(item)} className="btn-ghost" style={{ padding: "7px 10px", fontSize: 12 }}>Restore</button>}
                  <button onClick={() => setExpandId(isExpanded ? null : item.ein)} className="btn-ghost" style={{ padding: "7px 10px", fontSize: 12 }}>
                    {isExpanded ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {isEditing && (
                <div style={{ padding: "0 18px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, borderTop: "1px solid #f0f2f8", paddingTop: 14 }}>
                  {([
                    { l: "Award Amount", k: "amount" },
                    { l: "Deadline", k: "deadline" },
                    { l: "County", k: "county" },
                    { l: "Website URL", k: "url" },
                  ] as const).map(f => (
                    <div key={f.k}>
                      <div style={S.label}>{f.l}</div>
                      <input value={String(draft[f.k] ?? "")} onChange={e => setDraft(d => ({ ...d, [f.k]: e.target.value }))} style={S.input} />
                    </div>
                  ))}
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={S.label}>Eligibility</div>
                    <textarea value={String(draft.eligibility ?? "")} onChange={e => setDraft(d => ({ ...d, eligibility: e.target.value }))} style={{ ...S.input, height: 60, resize: "vertical" }} />
                  </div>
                  <div>
                    <div style={S.label}>Tags (comma-sep)</div>
                    <input value={tagsStr} onChange={e => setTagsStr(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <div style={S.label}>Internal Notes</div>
                    <input value={String(draft.notes ?? "")} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} style={S.input} />
                  </div>
                </div>
              )}

              {/* Expanded details */}
              {isExpanded && !isEditing && (
                <div style={{ padding: "14px 18px", borderTop: "1px solid #f0f2f8" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 12 }}>
                    {[
                      { l: "Est. Amount", v: item.amount ?? "—" },
                      { l: "990 Grants", v: `$${(item.grants_paid ?? 0).toLocaleString()}` },
                      { l: "Filing Year", v: String(item.latest_year ?? "—") },
                      { l: "Revenue", v: `$${(item.revenue_raw ?? 0).toLocaleString()}` },
                      { l: "NTEE", v: item.ntee_code ?? "—" },
                      { l: "County", v: item.county ?? "—" },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ background: "#f8faff", borderRadius: 8, padding: "9px 11px" }}>
                        <div style={S.label}>{l}</div>
                        <div style={{ fontSize: 13, color: "#0d1f3c", fontWeight: 600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: "#5a6a8a", lineHeight: 1.6, marginBottom: 10 }}>{item.eligibility}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {(item.tags ?? []).map(t => <span key={t} className="tag-chip">{t}</span>)}
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    {item.propublica_url && (
                      <a href={item.propublica_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#e85d26", fontWeight: 700, textDecoration: "none" }}>ProPublica -&gt;</a>
                    )}
                    {item.url && item.url !== "#" && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#0f6eb4", fontWeight: 700, textDecoration: "none" }}>Website -&gt;</a>
                    )}
                  </div>
                  {item.notes && <div style={{ marginTop: 10, fontSize: 12, color: "#5a6a8a", background: "#fffbee", padding: "8px 12px", borderRadius: 8 }}>Note: {item.notes}</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- BLOG TRACKER ------------------------------------------------------------

function BlogTracker() {
  const [posts, setPosts, postsReady] = useLocalStorage<BlogPost[]>("cms:blog", [])
  const [filter, setFilter] = useState<"all" | "draft" | "written" | "published">("all")
  const [search, setSearch] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<BlogPost>>({})
  const [showNewForm, setShowNewForm] = useState(false)
  const [newPost, setNewPost] = useState<Partial<BlogPost>>({})

  // Seed on first load
  useEffect(() => {
    if (!postsReady) return
    const existing = new Set(posts.map(p => p.id))
    const newPosts = BLOG_SEED.filter(p => !existing.has(p.id))
    if (newPosts.length > 0) setPosts([...posts, ...newPosts])
  }, [postsReady])

  const updatePost = (id: string, changes: Partial<BlogPost>) => {
    setPosts(posts.map(p => p.id === id ? { ...p, ...changes } : p))
  }

  const filtered = useMemo(() => posts.filter(p => {
    if (filter !== "all" && p.status !== filter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [posts, filter, search])

  const counts = {
    draft: posts.filter(p => p.status === "draft").length,
    written: posts.filter(p => p.status === "written").length,
    published: posts.filter(p => p.status === "published").length,
  }

  const statusColor = { draft: "#e85d26", written: "#0f6eb4", published: "#1a7a4a" }
  const statusLabel = { draft: "Draft", written: "Written", published: "Published" }

  if (!postsReady) return <div style={{ padding: "60px 0", textAlign: "center", color: "#8a9abb" }}>Loading...</div>

  return (
    <div>
      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {([
          { k: "draft" as const, label: "To Write" },
          { k: "written" as const, label: "Written" },
          { k: "published" as const, label: "Published" },
        ]).map(x => (
          <div key={x.k} onClick={() => setFilter(filter === x.k ? "all" : x.k)} style={{
            background: filter === x.k ? statusColor[x.k] : "#fff",
            border: `1.5px solid ${filter === x.k ? "transparent" : "#e8edf5"}`,
            borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: filter === x.k ? "#fff" : statusColor[x.k], fontFamily: "'Fraunces', serif" }}>{counts[x.k]}</div>
            <div style={{ fontSize: 11, color: filter === x.k ? "rgba(255,255,255,0.8)" : "#8a9abb", fontWeight: 600, marginTop: 2 }}>{x.label}</div>
          </div>
        ))}
        <div style={{ background: "#fff", border: "1.5px solid #e8edf5", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1a3a6b", fontFamily: "'Fraunces', serif" }}>{posts.length}</div>
          <div style={{ fontSize: 11, color: "#8a9abb", fontWeight: 600, marginTop: 2 }}>Total</div>
        </div>
      </div>

      {/* New Post button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => setShowNewForm(f => !f)} style={{ background: "#1a3a6b", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {showNewForm ? "Cancel" : "+ New Post"}
        </button>
      </div>

      {/* New Post form */}
      {showNewForm && (
        <div style={{ background: "#fff", border: "1.5px solid #1a3a6b", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: "#0d1f3c", marginBottom: 14 }}>New Blog Post</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a9abb", marginBottom: 5 }}>Title / Scholarship Name</div>
              <input value={newPost.name ?? ""} onChange={e => setNewPost(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Gates Scholarship" style={{ width: "100%", background: "#f8faff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: "9px 12px", borderRadius: 8, fontSize: 14, fontWeight: 600 }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a9abb", marginBottom: 5 }}>Amount</div>
              <input value={newPost.amount ?? ""} onChange={e => setNewPost(p => ({ ...p, amount: e.target.value }))}
                placeholder="$1,000" style={{ width: "100%", background: "#f8faff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: "9px 12px", borderRadius: 8, fontSize: 13 }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a9abb", marginBottom: 5 }}>URL</div>
              <input value={newPost.url ?? ""} onChange={e => setNewPost(p => ({ ...p, url: e.target.value }))}
                placeholder="https://..." style={{ width: "100%", background: "#f8faff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: "9px 12px", borderRadius: 8, fontSize: 13 }} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a9abb", marginBottom: 5 }}>Notes</div>
              <textarea value={newPost.notes ?? ""} onChange={e => setNewPost(p => ({ ...p, notes: e.target.value }))}
                placeholder="SEO angle, outline, key points..."
                style={{ width: "100%", background: "#f8faff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: "9px 12px", borderRadius: 8, fontSize: 13, height: 60, resize: "vertical" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={() => {
              if (!newPost.name?.trim()) return
              const id = "blog-custom-" + Date.now()
              setPosts([...posts, {
                id, scholarship_id: 0, name: newPost.name ?? "", amount: newPost.amount ?? "",
                url: newPost.url ?? "", tags: [], category: "scholarship", eligibility: "",
                status: "draft", notes: newPost.notes ?? "", blog_url: "", created_at: new Date().toISOString(),
              }])
              setNewPost({}); setShowNewForm(false)
            }} style={{ background: "#1a3a6b", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Add Post
            </button>
            <button onClick={() => { setNewPost({}); setShowNewForm(false) }} className="btn-ghost" style={{ padding: "9px 16px", fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search scholarships..."
            style={{ width: "100%", background: "#fff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 500 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "draft", "written", "published"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`pill${filter === f ? " active" : ""}`} style={{ fontSize: 12, padding: "6px 14px" }}>{f}</button>
          ))}
        </div>
        {search && <button onClick={() => setSearch("")} className="btn-ghost" style={{ fontSize: 12, padding: "7px 12px", color: "#e85d26", borderColor: "#e85d26" }}>clear</button>}
      </div>

      <div style={{ fontSize: 13, color: "#8a9abb", fontWeight: 500, marginBottom: 16 }}>
        Showing <span style={{ color: "#1a3a6b", fontWeight: 800 }}>{filtered.length}</span> of {posts.length} posts
      </div>

      {/* Post list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(post => {
          const isEditing = editId === post.id
          const sc = statusColor[post.status]
          const cc = CAT_COLOR[post.category] ?? "#1a3a6b"

          return (
            <div key={post.id} style={{ background: "#fff", border: "1.5px solid #e8edf5", borderRadius: 14, overflow: "hidden", borderLeft: `4px solid ${sc}` }}>
              <div style={{ padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sc, background: `${sc}18`, padding: "2px 10px", borderRadius: 100 }}>{statusLabel[post.status]}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: cc, background: `${cc}14`, padding: "2px 8px", borderRadius: 100, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {CAT_ICON[post.category]} {post.category}
                    </span>
                    <span style={{ fontSize: 11, color: "#8a9abb", fontWeight: 500 }}>{post.amount}</span>
                    {post.deadline && <span style={{ fontSize: 11, color: "#8a9abb", fontWeight: 500 }}>{post.deadline}</span>}
                  </div>

                  {isEditing ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input value={draft.name ?? ""} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                        style={{ width: "100%", background: "#f8faff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: "9px 12px", borderRadius: 8, fontSize: 15, fontWeight: 700, fontFamily: "'Fraunces', serif" }} />
                      <textarea value={draft.notes ?? ""} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                        placeholder="Blog post notes, outline, key SEO points..."
                        style={{ width: "100%", background: "#f8faff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: "9px 12px", borderRadius: 8, fontSize: 13, height: 72, resize: "vertical" }} />
                      <input value={draft.blog_url ?? ""} onChange={e => setDraft(d => ({ ...d, blog_url: e.target.value }))}
                        placeholder="Published blog URL (once live)..."
                        style={{ width: "100%", background: "#f8faff", border: "1.5px solid #e2e7f0", color: "#0d1f3c", padding: "9px 12px", borderRadius: 8, fontSize: 13 }} />
                    </div>
                  ) : (
                    <>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: "#0d1f3c", lineHeight: 1.3, marginBottom: 4 }}>{post.name}</div>
                      <div style={{ fontSize: 12, color: "#8a9abb", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as const }}>{post.eligibility}</div>
                      {post.notes && <div style={{ fontSize: 12, color: "#5a6a8a", background: "#f8faff", padding: "5px 10px", borderRadius: 8, marginTop: 4 }}>{post.notes}</div>}
                      {post.blog_url && (
                        <a href={post.blog_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#1a7a4a", display: "inline-block", marginTop: 4, fontWeight: 700, textDecoration: "none" }}>
                          {post.blog_url}
                        </a>
                      )}
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 5, flexShrink: 0, flexWrap: "wrap", alignItems: "flex-start", justifyContent: "flex-end", maxWidth: 210 }}>
                  {!isEditing ? (<>
                    {post.status === "draft" && (
                      <button onClick={() => updatePost(post.id, { status: "written" })} style={{ background: "#0f6eb4", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                        Mark Written
                      </button>
                    )}
                    {post.status === "written" && (
                      <button onClick={() => updatePost(post.id, { status: "published" })} style={{ background: "#1a7a4a", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Publish
                      </button>
                    )}
                    {post.status === "published" && (
                      <button onClick={() => updatePost(post.id, { status: "written" })} className="btn-ghost" style={{ fontSize: 11, padding: "5px 9px", whiteSpace: "nowrap" }}>Unpublish</button>
                    )}
                    {post.status !== "draft" && (
                      <button onClick={() => updatePost(post.id, { status: "draft" })} className="btn-ghost" style={{ fontSize: 11, padding: "5px 9px" }}>Reset</button>
                    )}
                    <button onClick={() => { setEditId(post.id); setDraft({ name: post.name, notes: post.notes, blog_url: post.blog_url }) }} className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }}>Edit</button>
                    <a href={post.url} target="_blank" rel="noopener noreferrer" title="Official page" className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12, textDecoration: "none" }}>Link</a>
                    <a href={`/blog/${post.id.replace("blog-", "")}`} target="_blank" rel="noopener noreferrer" title="Blog post" className="btn-ghost" style={{ padding: "6px 10px", fontSize: 12, textDecoration: "none" }}>Blog</a>
                  </>) : (<>
                    <button onClick={() => { updatePost(post.id, { name: draft.name, notes: draft.notes, blog_url: draft.blog_url }); setEditId(null) }} className="btn-primary" style={{ padding: "7px 14px", fontSize: 12 }}>Save</button>
                    <button onClick={() => setEditId(null)} className="btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }}>Cancel</button>
                  </>)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#8a9abb" }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>No posts match your filter.</div>
          <button className="btn-ghost" style={{ marginTop: 12 }} onClick={() => { setFilter("all"); setSearch("") }}>Clear filters</button>
        </div>
      )}
    </div>
  )
}
