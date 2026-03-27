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

// 3-digit zip prefix → single state
function zipToState(zip: string): string | null {
  const prefix = parseInt(zip.substring(0, 3))
  if (prefix >= 750 && prefix <= 799) return 'TX'
  if (prefix >= 900 && prefix <= 961) return 'CA'
  if (prefix >= 100 && prefix <= 149) return 'NY'
  if (prefix >= 320 && prefix <= 349) return 'FL'
  if (prefix >= 600 && prefix <= 629) return 'IL'
  if (prefix >= 150 && prefix <= 196) return 'PA'
  if (prefix >= 430 && prefix <= 459) return 'OH'
  if (prefix >= 300 && prefix <= 319) return 'GA'
  if (prefix >= 270 && prefix <= 289) return 'NC'
  if (prefix >= 480 && prefix <= 499) return 'MI'
  if (prefix >= 70  && prefix <= 89)  return 'NJ'
  if (prefix >= 220 && prefix <= 246) return 'VA'
  if (prefix >= 980 && prefix <= 994) return 'WA'
  if (prefix >= 850 && prefix <= 865) return 'AZ'
  if (prefix >= 10  && prefix <= 27)  return 'MA'
  if (prefix >= 370 && prefix <= 385) return 'TN'
  if (prefix >= 460 && prefix <= 479) return 'IN'
  if (prefix >= 630 && prefix <= 658) return 'MO'
  if (prefix >= 206 && prefix <= 219) return 'MD'
  if (prefix >= 530 && prefix <= 549) return 'WI'
  if (prefix >= 550 && prefix <= 567) return 'MN'
  if (prefix >= 800 && prefix <= 816) return 'CO'
  if (prefix >= 350 && prefix <= 369) return 'AL'
  if (prefix >= 290 && prefix <= 299) return 'SC'
  if (prefix >= 700 && prefix <= 714) return 'LA'
  if (prefix >= 400 && prefix <= 427) return 'KY'
  if (prefix >= 970 && prefix <= 979) return 'OR'
  if (prefix >= 730 && prefix <= 749) return 'OK'
  if (prefix >= 60  && prefix <= 69)  return 'CT'
  if (prefix >= 500 && prefix <= 528) return 'IA'
  if (prefix >= 386 && prefix <= 397) return 'MS'
  if (prefix >= 716 && prefix <= 729) return 'AR'
  if (prefix >= 660 && prefix <= 679) return 'KS'
  if (prefix >= 840 && prefix <= 847) return 'UT'
  if (prefix >= 889 && prefix <= 898) return 'NV'
  if (prefix >= 870 && prefix <= 884) return 'NM'
  if (prefix >= 680 && prefix <= 693) return 'NE'
  if (prefix >= 247 && prefix <= 268) return 'WV'
  if (prefix >= 832 && prefix <= 838) return 'ID'
  if (prefix >= 967 && prefix <= 968) return 'HI'
  if (prefix >= 39  && prefix <= 49)  return 'ME'
  if (prefix >= 30  && prefix <= 38)  return 'NH'
  if (prefix >= 28  && prefix <= 29)  return 'RI'
  if (prefix >= 590 && prefix <= 599) return 'MT'
  if (prefix >= 197 && prefix <= 199) return 'DE'
  if (prefix >= 570 && prefix <= 577) return 'SD'
  if (prefix >= 995 && prefix <= 999) return 'AK'
  if (prefix >= 820 && prefix <= 831) return 'WY'
  return null
}

function citySlug(city: string) {
  return city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function searchFoundations(query: string, data: Foundation[]): { results: Foundation[]; zipState: string | null } {
  const q = query.trim().toLowerCase()
  if (!q) return { results: [], zipState: null }

  // 5-digit zip → single state via 3-digit prefix
  if (/^\d{5}$/.test(q)) {
    const state = zipToState(q)
    const results = state ? data.filter(f => f.state.toUpperCase() === state) : []
    return { results, zipState: state }
  }

  // Check if query matches a full state name → abbreviation
  const abbrFromName = NAME_TO_ABBR[q]

  const results = data.filter(f => {
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
  return { results, zipState: null }
}

export default function LocalSearchClient({ data }: { data: Foundation[] }) {
  const [query, setQuery] = useState("")
  const hasQuery = query.trim().length > 0

  const { results, zipState } = useMemo(() => searchFoundations(query, data), [query, data])

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
                {zipState
                  ? `Showing foundations in ${STATE_NAMES[zipState] || zipState} (zip ${query.trim()})`
                  : `${results.length} foundation${results.length !== 1 ? "s" : ""} match your search`}
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
