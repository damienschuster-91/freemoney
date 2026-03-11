import type { Metadata } from "next"
import Link from "next/link"
import { SCHOLARSHIPS, LOCAL_DATA } from "@/lib/data"

export const metadata: Metadata = {
  title: "About Free Money Directory",
  description: "How we find and verify scholarships, grants, and local foundation money. Free. No signup. No spam.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return (
    <>
      <section style={{
        background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 100%)",
        padding: "56px 24px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "clamp(30px, 5vw, 48px)",
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "-0.02em",
          marginBottom: 12,
        }}>
          About This Directory
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", maxWidth: 540, margin: "0 auto" }}>
          Free. No account. No spam. Just verified scholarship data.
        </p>
      </section>

      <div className="page-wrap-sm">

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 48, marginTop: 8 }}>
          {[
            { n: SCHOLARSHIPS.length, label: "National Listings" },
            { n: LOCAL_DATA.length, label: "Local Foundations" },
            { n: SCHOLARSHIPS.filter(s => s.renewable).length, label: "Renewable Awards" },
            { n: SCHOLARSHIPS.filter(s => s.tags.includes("no-essay")).length, label: "No-Essay Awards" },
          ].map(stat => (
            <div key={stat.label} className="info-cell" style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 900, color: "#1a3a6b" }}>{stat.n}</div>
              <div style={{ fontSize: 12, color: "#8a9abb", fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <article className="blog-article">
          <h2>What This Is</h2>
          <p>
            Free Money Directory is a no-nonsense scholarship database built for students who are tired of
            spam-gated scholarship sites. Every listing is free to apply. No account required to browse.
            No email harvesting.
          </p>

          <h2>How We Find Local Scholarships</h2>
          <p>
            Most scholarship aggregators only list what organizations submit to them. We go further: we
            read IRS Form 990 filings (public records) to find community foundation scholarship funds that
            never advertise. These are often easier to win because fewer students know about them.
          </p>
          <div className="callout">
            💡 A local foundation scholarship with 30 applicants is statistically a better use of your
            time than a national scholarship with 50,000 applicants — even if the dollar amount is smaller.
          </div>

          <h2>Accuracy & Verification</h2>
          <p>
            Deadlines, amounts, and eligibility requirements change every year. We include direct links
            to official sources for every listing. Always verify at the official site before applying.
            If you find outdated information, the best path is always to check the source directly.
          </p>

          <h2>The 990 Scraper</h2>
          <p>
            We built an open-source tool that queries the ProPublica Nonprofit Explorer API to surface
            community foundations by state. It's included in this project — run it locally to populate
            your own local scholarships database. No API key required.
          </p>
          <div style={{
            background: "#1a1a2e",
            borderRadius: 12,
            padding: "16px 20px",
            fontFamily: "monospace",
            fontSize: 13,
            color: "#7eb8f7",
            marginBottom: 24,
          }}>
            <div style={{ color: "#8a9abb", marginBottom: 6 }}># Install and run</div>
            <div>npm install node-fetch</div>
            <div>node 990-scraper-agent.js TX CA NY</div>
            <div style={{ color: "#8a9abb", marginTop: 6 }}># Outputs JSON → paste into CMS import</div>
          </div>

          <h2>No Ads. No Sponsored Results.</h2>
          <p>
            Rankings are alphabetical or by deadline. No scholarship pays to appear here. No listing
            is hidden behind a paywall. This is a pure utility.
          </p>
        </article>

        <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/scholarships" className="btn-primary">Browse Scholarships →</Link>
          <Link href="/local" className="btn-ghost">Find Local Money →</Link>
        </div>
      </div>
    </>
  )
}
