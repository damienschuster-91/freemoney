import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SCHOLARSHIPS, CAT_META } from "@/lib/data"
import { SITE_NAME } from "@/lib/utils"

export async function generateStaticParams() {
  return SCHOLARSHIPS.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const s = SCHOLARSHIPS.find(x => x.slug === params.slug)
  if (!s) return {}
  return {
    title: `How to Win the ${s.name} (${s.amount})`,
    description: `Complete guide to the ${s.name}: eligibility, application tips, deadlines, and how to stand out. ${s.amount} available.`,
    alternates: { canonical: `/blog/${s.slug}` },
    openGraph: {
      title: `How to Win the ${s.name} | ${SITE_NAME}`,
      description: `${s.amount} — ${s.eligibility.slice(0, 160)}`,
    },
  }
}

// Static article content — replace with MDX files or CMS as you write real posts
function generateArticle(s: (typeof SCHOLARSHIPS)[number]) {
  const meta = CAT_META[s.category]
  const isNoEssay = s.tags.includes("no-essay")
  const isRenewable = s.renewable

  return {
    intro: `The ${s.name} is one of the ${s.amount.includes("Full") ? "most prestigious full-ride" : "top"} ${meta.label.toLowerCase()} opportunities available to students. ${s.eligibility} This guide covers everything you need to know to put together a competitive application.`,
    quickFacts: [
      { label: "Award", value: s.amount },
      { label: "Deadline", value: s.deadline || "Check official site" },
      { label: "GPA Required", value: s.gpa || "None stated" },
      { label: "Renewable", value: isRenewable ? "Yes — apply once, receive multiple years" : "One-time award" },
    ],
    sections: [
      {
        heading: "Who Is This For?",
        body: `${s.eligibility} If you meet these criteria, you should absolutely apply — the return on time invested is high, especially ${isNoEssay ? "since no essay is required" : "relative to other competitive scholarships"}.`,
      },
      {
        heading: isNoEssay ? "How to Apply (No Essay Required)" : "Application Tips",
        body: isNoEssay
          ? `This is a no-essay scholarship, meaning you won't need to write a personal statement. Complete the application form accurately and completely. Even though it's quick, treat it seriously — some no-essay awards still review GPA, activities, or conduct a random drawing among eligible applicants.`
          : `Start your application at least 4–6 weeks before the deadline. Review the prompt carefully before writing — most essays are rejected because applicants answer the question they wished was asked, not the one actually asked. Use specific examples from your life rather than generic statements. Have at least two people proofread before submitting.`,
      },
      {
        heading: "How Competitive Is It?",
        body: `${s.tags.includes("national") || s.category === "scholarship" ? "National scholarships like this attract thousands of applicants." : "This award has a more targeted applicant pool, meaning your odds are better than most."} Focus on demonstrating genuine fit with the ${s.name}'s mission and values, not just meeting the minimum requirements.`,
      },
      {
        heading: isRenewable ? "Keeping the Award" : "After You Apply",
        body: isRenewable
          ? `Because this award renews annually, maintaining eligibility is crucial. Understand the renewal requirements — usually a minimum GPA and continued enrollment — before accepting. The multi-year value makes this one of the highest-ROI applications you can submit.`
          : `After submitting, confirm receipt with the awarding organization if possible. Award decisions are typically announced 4–8 weeks after the deadline. Whether or not you win, use the application process as practice — the strongest applicants apply to 10–20 scholarships per season.`,
      },
      {
        heading: "Other Scholarships to Apply Alongside This One",
        body: `Don't put all your eggs in one basket. While the ${s.name} is worth applying for, the best strategy is applying to multiple awards simultaneously. Browse our full list of ${meta.label.toLowerCase()} opportunities to find others that fit your profile.`,
      },
    ],
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const s = SCHOLARSHIPS.find(x => x.slug === params.slug)
  if (!s) notFound()

  const meta = CAT_META[s.category]
  const article = generateArticle(s)

  // Related posts
  const related = SCHOLARSHIPS.filter(x => x.category === s.category && x.id !== s.id).slice(0, 3)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `How to Win the ${s.name}`,
    description: `Complete guide to the ${s.name}: eligibility, application tips, and how to stand out.`,
    url: `/blog/${s.slug}`,
    about: {
      "@type": "EducationalOccupationalProgram",
      name: s.name,
      url: s.url,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="detail-breadcrumb">
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#8a9abb" }}>
          <Link href="/" style={{ color: "#8a9abb" }}>Home</Link>
          <span>›</span>
          <Link href="/blog" style={{ color: "#8a9abb" }}>Blog</Link>
          <span>›</span>
          <span style={{ color: "#0d1f3c", fontWeight: 600, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {s.name}
          </span>
        </div>
        <Link href="/blog" className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>
          ← All Guides
        </Link>
      </div>

      <div className="page-wrap-sm">
        {/* Article header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <span className="card-cat" style={{ color: meta.color, background: `${meta.color}14` }}>
              {meta.icon} {meta.label}
            </span>
            {s.tags.slice(0, 3).map(t => (
              <span key={t} className="tag-chip">{t}</span>
            ))}
          </div>

          <article className="blog-article">
            <h1>How to Win the {s.name}</h1>

            {/* Quick facts box */}
            <div style={{
              background: "#f8faff",
              border: "1.5px solid #dce4f5",
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 32,
            }}>
              <div style={{ fontWeight: 700, color: "#1a3a6b", marginBottom: 12, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Quick Facts
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {article.quickFacts.map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 11, color: "#8a9abb", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{f.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0d1f3c", marginTop: 3 }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <p>{article.intro}</p>

            {article.sections.map(sec => (
              <div key={sec.heading}>
                <h2>{sec.heading}</h2>
                <p>{sec.body}</p>
              </div>
            ))}

            {/* CTA */}
            <div className="callout">
              <strong>Ready to apply?</strong> Visit the official {s.name} website to get the current application, verify this year's deadline, and submit your materials.
            </div>

            <p style={{ marginTop: 24 }}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-flex", padding: "13px 28px", borderRadius: 12, textDecoration: "none" }}>
                Apply on Official Site →
              </a>
            </p>

            <p style={{ fontSize: 13, color: "#b0bbcc", marginTop: 20, fontStyle: "italic" }}>
              Always verify current deadlines and eligibility at the official source. Details change yearly.
            </p>
          </article>
        </div>

        {/* Also see scholarship detail */}
        <div style={{ background: "#f4f6fb", border: "1.5px solid #e8edf5", borderRadius: 14, padding: "16px 20px", marginBottom: 40 }}>
          <div style={{ fontSize: 12, color: "#8a9abb", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            See Also
          </div>
          <Link
            href={`/scholarships/${s.slug}`}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none" }}
          >
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, color: "#0d1f3c" }}>{s.name} — Directory Listing</div>
              <div style={{ fontSize: 13, color: "#8a9abb" }}>Eligibility, tags, and direct application link</div>
            </div>
            <span style={{ color: "#1a3a6b", fontWeight: 700, fontSize: 13 }}>View →</span>
          </Link>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div>
            <h2 className="section-title" style={{ fontSize: 20, marginBottom: 16 }}>More {meta.label} Guides</h2>
            <div className="related-grid">
              {related.map(r => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="related-card">
                  <div style={{ fontSize: 12, color: meta.color, fontWeight: 700, marginBottom: 6 }}>
                    {meta.icon} {r.amount}
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: "#0d1f3c", lineHeight: 1.3 }}>
                    How to Win the {r.name}
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
