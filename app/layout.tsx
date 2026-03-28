import type { Metadata } from "next"
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/utils"
import Navbar from "@/components/Navbar"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Free Scholarships, Grants & Trades`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free Scholarships, Grants & Trades`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="footer-logo">$</div>
              <div>
                <div className="footer-name">LocalScholarships.org</div>
                <div className="footer-tagline">355+ verified opportunities. Always free.</div>
              </div>
            </div>
            <div className="footer-links">
              <a href="/scholarships">Scholarships</a>
              <a href="/local">Local Foundations</a>
              <a href="/blog">Blog</a>
              <a href="/about">About</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
