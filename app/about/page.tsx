import type { Metadata } from "next"
import Link from "next/link"
import { SCHOLARSHIPS, LOCAL_DATA } from "@/lib/data"

export const metadata: Metadata = {
  title: { absolute: "About | LocalScholarships.org" },
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
          About LocalScholarships.org
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
          <p>
            When I was in high school, I think I applied for a couple of scholarships. I usually looked
            for the easiest one to apply to and hit send. I didn&apos;t put in the effort I should have,
            and it cost me -- literally. At my high school graduation, I remember seeing some of my peers
            receive dozens of local scholarships that I didn&apos;t even know existed. I wasn&apos;t mad,
            but I was feeling down on myself for not making more of an effort. It seemed so obvious in
            retrospect.
          </p>
          <p>
            When we built localscholarships.org, we relied on finding truly local foundations that give
            out real scholarships. We grew our database by analyzing thousands of non-profit organizations
            and sorting them by state. By law, non-profit organizations are required to file IRS Form 990.
            This form, among other things, shows how much money these organizations award -- including
            grants and scholarships. That means, if a foundation filed a 990 and reported awarding
            scholarship funds, then it&apos;s real. That&apos;s our baseline for every local scholarship
            on our site.
          </p>

          <h2>Finding Local Scholarships</h2>
          <p>
            We focus on local scholarships because your chances of winning are much higher than those for
            national scholarships. You&apos;re competing locally instead of nationally. This doesn&apos;t
            mean you shouldn&apos;t apply to national scholarships -- you should. However, you should also
            invest time and effort into scholarships in your backyard. Most of the time, you might not
            even know about these scholarships because they aren&apos;t publicly advertised like the
            national ones. Usually, they are listed in a foundation&apos;s annual report, at a school
            counselor meeting, or quietly posted on a local non-profit website. It&apos;s our job to find
            them so you don&apos;t have to.
          </p>
          <p>
            Finding local scholarships in your community is easy. Start on our homepage, click
            &quot;Local&quot; in the top header, and select your state.
          </p>

          <h2>Trades &amp; Vocational Programs</h2>
          <p>
            As we&apos;ve evolved, we&apos;ve also included opportunities for trade school grants and
            scholarships. A college degree is only one path of many alternatives in our changing world.
            Trade schools offer competitive opportunities. Whether you are interested in electrical, HVAC,
            welding, plumbing, construction, or something else -- chances are we&apos;ve got options for
            you to explore without taking on debt.
          </p>

          <h2>Accuracy &amp; Verification</h2>
          <p>
            Deadlines, amounts, and eligibility requirements can change every year. Sometimes we might
            have &quot;varies&quot; in place for these details on our listings. To help with this, we have
            included direct links to official sources for every listing. Make sure to always verify at the
            official site before applying. If you find outdated information, the best path is always to
            check the source directly.
          </p>

          <h2>Adding New Scholarships</h2>
          <p>
            We check every week for new scholarships and add them to our site. If you know of a
            scholarship we missed or one you think we should include, drop us a line at{" "}
            <a href="mailto:hello@localscholarships.org">hello@localscholarships.org</a>.
          </p>

          <h2>Our Promise</h2>
          <p>
            We remain an open directory. Every listing is free to browse. No account is required to use
            the site. In the future, we may create accounts (at no charge) for users to bookmark
            scholarships, grants, and trades, track progress, and set reminders for deadlines.
          </p>
        </article>

        <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/scholarships" className="btn-primary">Browse Scholarships</Link>
          <Link href="/local" className="btn-ghost">Find Local Money</Link>
        </div>
      </div>
    </>
  )
}
