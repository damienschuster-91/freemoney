"use client"

import { useState, useMemo } from "react"
import Link from "next/link"

type Foundation = {
  id: number
  name: string
  state: string
  city: string
  slug: string
  amount: string
  deadline: string
  eligibility: string
  url: string
  propublica_url?: string
  county?: string
}

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",
  VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
}

// State name → abbreviation for text search
const NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([k, v]) => [v.toLowerCase(), k])
)

// Zip first-digit → state abbreviations (per spec)
const ZIP_FIRST: Record<string, string[]> = {
  "0": ["CT","MA","ME","NH","NJ","NY","RI","VT"],
  "1": ["DE","MD","NJ","NY","PA"],
  "2": ["DC","MD","NC","SC","VA","WV"],
  "3": ["AL","FL","GA","MS","TN"],
  "4": ["IN","KY","MI","OH"],
  "5": ["IA","MN","MT","ND","SD","WI"],
  "6": ["IL","KS","MO","NE"],
  "7": ["AR","LA","OK","TX"],
  "8": ["AZ","CO","ID","NM","NV","UT","WY"],
  "9": ["AK","CA","HI","OR","WA"],
}

function citySlug(city: string) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function searchFoundations(query: string, data: Foundation[]): Foundation[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  // Zip code: 3–5 digits
  if (/^\d{3,5}$/.test(q)) {
    const states = ZIP_FIRST[q[0]] ?? []
    return data.filter(f => states.includes(f.state.toUpperCase()))
  }

  // Check if query matches a full state name → abbreviation
  const abbrFromName = NAME_TO_ABBR[q]

  return data.filter(f => {
    const city = (f.city ?? "").toLowerCase()
    const state = f.state.toLowerCase()
    const stateFull = (STATE_NAMES[f.state.toUpperCase()] ?? "").toLowerCase()
    const elig = (f.eligibility ?? "").toLowerCase()
    const county = (f.county ?? "").toLowerCase()

    if (abbrFromName) return f.state.toUpperCase() === abbrFromName

    return (
      city.includes(q) ||
      state.includes(q) ||
      stateFull.includes(q) ||
      elig.includes(q) ||
      county.includes(q)
    )
  })
}

export default function LocalSearchClient({ data }: { data: Foundation[] }) {
  const [query, setQuery] = useState("")
  const hasQuery = query.trim().length > 0

  const results = useMemo(() => searchFoundations(query, data), [query, data])

  const resultStates = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const f of results) {
      const s = f.state.toUpperCase()
      if (!seen.has(s)) { seen.add(s); out.push(s) }
    }
    return out.sort()
  }, [results])

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
          fontSize: 18, pointerEvents: "none", color: "#94a3b8",
        }}>
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by city, state, or zip code..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "14px 44px 14px 46px",
            fontSize: 16,
            border: "2px solid #e2e8f0",
            borderRadius: 12,
            outline: "none",
            background: "white",
            color: "#0f172a",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
          onFocus={e => (e.target.style.borderColor = "#1a7a4a")}
          onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
        />
        {hasQuery && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "#e2e8f0", border: "none", borderRadius: "50%",
              width: 24, height: 24, cursor: "pointer",
              fontSize: 14, color: "#64748b", lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Results */}
      {hasQuery && (
        <div style={{ marginTop: 20 }}>
          {results.length > 0 ? (
            <>
              {/* Count */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a7a4a", marginBottom: 12 }}>
                {results.length} foundation{results.length !== 1 ? "s" : ""} match your search
              </div>

              {/* State page links */}
              {resultStates.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  {resultStates.map(abbr => (
                    <Link
                      key={abbr}
                      href={`/local/${abbr.toLowerCase()}`}
                      style={{
                        fontSize: 13, color: "#2563eb", fontWeight: 600,
                        textDecoration: "none", background: "#eff6ff",
                        border: "1px solid #bfdbfe", borderRadius: 8,
                        padding: "5px 12px",
                      }}
                    >
                      See all {STATE_NAMES[abbr] || abbr} foundations →
                    </Link>
                  ))}
                </div>
              )}

              {/* Result cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {results.map(f => (
                  <div
                    key={f.id}
                    style={{
                      background: "white", borderRadius: 14,
                      border: "1px solid #e2e8f0", borderLeft: "3px solid #1a7a4a",
                      padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <Link
                          href={`/local/${f.state.toLowerCase()}/${f.slug}`}
                          style={{ textDecoration: "none" }}
                        >
                          <h3 style={{
                            fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 700,
                            color: "#0f172a", marginBottom: 6, marginTop: 0,
                          }}>
                            {f.name}
                          </h3>
                        </Link>
                        <p style={{ color: "#475569", fontSize: 14, marginBottom: 10, marginTop: 0, lineHeight: 1.5 }}>
                          {f.eligibility}
                        </p>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: "#64748b" }}>
                          <span>📍 {f.city}, {f.state}</span>
                          {f.deadline && <span>Deadline: {f.deadline}</span>}
                          <Link
                            href={`/local/${f.state.toLowerCase()}/${citySlug(f.city)}-scholarships`}
                            style={{ color: "#2563eb", fontWeight: 600 }}
                          >
                            All {f.city} scholarships
                          </Link>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                        <div style={{
                          background: "#f0fdf4", color: "#15803d", fontSize: 14,
                          fontWeight: 700, padding: "6px 14px", borderRadius: 999,
                          border: "1px solid #bbf7d0", whiteSpace: "nowrap",
                        }}>
                          {f.amount}
                        </div>
                        <Link
                          href={`/local/${f.state.toLowerCase()}/${f.slug}`}
                          style={{ fontSize: 13, color: "#2563eb", fontWeight: 600 }}
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{
              textAlign: "center", padding: "28px 20px",
              background: "white", borderRadius: 12,
              border: "1px solid #e2e8f0", color: "#64748b", fontSize: 15,
            }}>
              No exact matches — browse by state below
            </div>
          )}
        </div>
      )}
    </div>
  )
}
