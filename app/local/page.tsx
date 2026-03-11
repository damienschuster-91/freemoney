import type { Metadata } from "next"
import Link from "next/link"
import { LOCAL_DATA } from "@/lib/data"

export const metadata: Metadata = {
  title: "Local Foundation Scholarships by State",
  description: `Browse ${LOCAL_DATA.length}+ 990-verified local community foundation scholarships. Less competition than national awards. Find hidden money in your state.`,
  alternates: { canonical: "/local" },
}

// Build state index
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

function buildStateIndex() {
  const idx: Record<string, number> = {}
  for (const item of LOCAL_DATA) {
    idx[item.state] = (idx[item.state] || 0) + 1
  }
  return idx
}

export default function LocalPage() {
  const stateIdx = buildStateIndex()
  const states = Object.entries(stateIdx).sort((a, b) => a[0].localeCompare(b[0]))
  const topStates = Object.entries(stateIdx).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #0d2e1a 0%, #1a7a4a 100%)",
        padding: "48px 24px 56px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div className="hero-badge">📍 990-Verified Sources</div>
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(30px, 6vw, 52px)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 14,
          }}>
            Local Foundation<br />Scholarships
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: 0 }}>
            {LOCAL_DATA.length}+ community foundation funds verified via IRS 990 filings.
            <br />Less competition. Often easier to win.
          </p>
        </div>
      </section>

      <div className="page-wrap">

        {/* Why local callout */}
        <div className="info-box" style={{ marginBottom: 32 }}>
          <div className="info-box-title">💡 Why Local Scholarships Win</div>
          <p className="info-box-text">
            National scholarships get tens of thousands of applicants. Many local foundation scholarships
            get fewer than 50. These funds are required by law to give money away every year — they just
            don't advertise. We find them by reading IRS 990 forms so you don't have to.
          </p>
        </div>

        {/* Top states */}
        {topStates.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <h2 className="section-title" style={{ fontSize: 20, marginBottom: 14 }}>Most Listings</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {topStates.map(([abbr, count]) => (
                <Link
                  key={abbr}
                  href={`/local/${abbr.toLowerCase()}`}
                  className="pill"
                  style={{ gap: 8 }}
                >
                  📍 {STATE_NAMES[abbr] || abbr}
                  <span style={{ background: "#e8f5ee", color: "#1a7a4a", borderRadius: 100, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Full state grid */}
        <div style={{ marginBottom: 40 }}>
          <h2 className="section-title" style={{ fontSize: 20, marginBottom: 16 }}>Browse by State</h2>
          <div className="state-grid">
            {states.map(([abbr, count]) => (
              <Link key={abbr} href={`/local/${abbr.toLowerCase()}`} className="state-tile">
                <div className="state-tile-abbr">{abbr}</div>
                <div className="state-tile-name">{STATE_NAMES[abbr] || abbr}</div>
                <div className="state-tile-count">{count} listing{count !== 1 ? "s" : ""}</div>
              </Link>
            ))}
            {states.length === 0 && (
              <div style={{ gridColumn: "1/-1" }} className="empty-state">
                <div className="empty-emoji">🗺️</div>
                <div className="empty-text">
                  No local listings yet — use the 990 Scraper to populate your state.
                  <br />
                  <Link href="/about" style={{ color: "#1a7a4a", fontWeight: 700 }}>Learn how →</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All listings preview */}
        {LOCAL_DATA.length > 0 && (
          <div>
            <h2 className="section-title" style={{ fontSize: 20, marginBottom: 16 }}>All Local Listings</h2>
            <div className="card-grid">
              {LOCAL_DATA.slice(0, 12).map(s => (
                <Link key={s.id} href={`/local/${s.state.toLowerCase()}/${s.slug}`} className="card">
                  <div className="card-accent" style={{ background: "linear-gradient(90deg,#1a7a4a,#1a7a4a88)" }} />
                  <div className="card-body">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span className="card-cat" style={{ color: "#1a7a4a", background: "#e8f5ee" }}>
                        📍 Local
                      </span>
                      <span style={{ fontSize: 11, color: "#8a9abb", fontWeight: 600 }}>{s.state}</span>
                    </div>
                    <div className="card-name">{s.name}</div>
                    <div className="card-amount" style={{ color: "#1a7a4a" }}>{s.amount}</div>
                    <p className="card-elig">{s.eligibility}</p>
                    <div className="card-footer">
                      <div className="card-meta">
                        <span>{s.city || s.county}</span>
                      </div>
                      {s.propublica_url && (
                        <span style={{ fontSize: 11, color: "#8a9abb", fontWeight: 600 }}>990 ✓</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {LOCAL_DATA.length > 12 && (
              <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#8a9abb" }}>
                Showing 12 of {LOCAL_DATA.length}. Browse by state above to see all.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
