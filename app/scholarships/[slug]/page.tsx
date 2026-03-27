import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SCHOLARSHIPS, CAT_META, slugify } from "@/lib/data"
import { SITE_NAME } from "@/lib/utils"
import ApplyButton from "@/components/ApplyButton"

// Pre-generate every non-trade scholarship page at build time
export async function generateStaticParams() {
  return SCHOLARSHIPS.filter(s => s.category !== "trade").map(s => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const s = SCHOLARSHIPS.find(x => x.slug === params.slug)
  if (!s) return {}
  const meta = CAT_META[s.category]
  return {
    title: `${s.name} — ${s.amount}`,
    description: `${s.name}: ${s.amount} ${meta.label.toLowerCase()}. ${s.eligibility.slice(0, 140)}`,
    openGraph: {
      title: `${s.name} | ${SITE_NAME}`,
      description: s.eligibility.slice(0, 200),
    },
    alternates: {
      canonical: `/scholarships/${s.slug}`,
    },
  }
}

export default function ScholarshipDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const s = SCHOLARSHIPS.find(x => x.slug === params.slug)
  if (!s) notFound()

  const meta = CAT_META[s.category]

  // Related: same category, different id
  const related = SCHOLARSHIPS.filter(
    x => x.category === s.category && x.id !== s.id
  ).slice(0, 4)

  // JSON-LD structured data for Google rich snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Grant",
    name: s.name,
    url: s.url,
    funder: { "@type": "Organization", name: s.name },
    description: s.eligibility,
    amount: { "@type": "MonetaryAmount", currency: "USD", description: s.amount },
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="detail-breadcrumb">
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8a9abb" }}>
          <Link href="/" style={{ color: "#8a9abb" }}>Home</Link>
          <span>›</span>
          <Link href={s.category === "trade" ? "/trades" : "/scholarships"} style={{ color: "#8a9abb" }}>
            {s.category === "trade" ? "Trades" : "Scholarships"}
          </Link>
          <span>›</span>
          <span style={{ color: "#0d1f3c", fontWeight: 600 }}>{s.name}</span>
        </div>
        <Link href={s.category === "trade" ? "/trades" : "/scholarships"} className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>
          {s.category === "trade" ? "← All Trades" : "← All Scholarships"}
        </Link>
      </div>

      {/* Hero */}
      <section
        className="detail-hero"
        style={{
          background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}cc 100%)`,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <span
            className="card-cat"
            style={{ color: "#fff", background: "rgba(255,255,255,0.2)", marginBottom: 14, display: "inline-block" }}
          >
            {meta.icon} {meta.label}
          </span>
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(26px, 5vw, 44px)",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: 14,
            }}
          >
            {s.name}
          </h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{s.amount}</span>
            {s.renewable && (
              <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 100 }}>
                ↺ Renewable
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="page-wrap-md">
        {/* Info grid */}
        <div className="detail-info-grid">
          {[
            { label: "Award Amount", value: s.amount },
            { label: "Deadline", value: s.deadline || "Varies" },
            { label: "Min. GPA", value: s.gpa || "None" },
            { label: "Renewable", value: s.renewable ? "Yes ↺" : "One-time" },
            { label: "Category", value: meta.label },
          ].map(cell => (
            <div key={cell.label} className="info-cell">
              <div className="info-label">{cell.label}</div>
              <div className="info-value">{cell.value}</div>
            </div>
          ))}
        </div>

        {/* Eligibility */}
        <div className="eligibility-block">
          <h2
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#0d1f3c",
              marginBottom: 12,
              paddingLeft: 16,
              borderLeft: `4px solid ${meta.color}`,
            }}
          >
            Eligibility Requirements
          </h2>
          <p>{s.eligibility}</p>
        </div>

        {/* Tags */}
        {s.tags.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8a9abb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Tags
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {s.tags.map(t => (
                <Link
                  key={t}
                  href={`/scholarships?tag=${t}`}
                  className="tag-chip"
                  style={{ textDecoration: "none", cursor: "pointer" }}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginBottom: 20 }}>
          <ApplyButton
            url={s.url}
            deadline={s.deadline}
            applicationOpen={s.application_open}
            applicationClose={s.deadline}
            accentColor="#1a3a6b"
            openLabel="Apply on Official Site →"
          />
        </div>

        {/* Disclaimer */}
        <div className="disclaimer">
          ⚠️ Always verify current deadlines and requirements at the official website above — details change yearly. This listing is for informational purposes only.
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2
              className="section-title"
              style={{ marginBottom: 16, fontSize: 22 }}
            >
              More {meta.label}s
            </h2>
            <div className="related-grid">
              {related.map(r => (
                <Link key={r.id} href={`/scholarships/${r.slug}`} className="related-card">
                  <div style={{ fontSize: 12, color: meta.color, fontWeight: 700, marginBottom: 6 }}>
                    {meta.icon} {r.amount}
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: "#0d1f3c", lineHeight: 1.3 }}>
                    {r.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
