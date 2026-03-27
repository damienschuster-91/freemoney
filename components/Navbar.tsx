"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { SCHOLARSHIPS, LOCAL_DATA } from "@/lib/data"

export default function Navbar() {
  const pathname = usePathname()
  const total = SCHOLARSHIPS.length + LOCAL_DATA.length
  const [open, setOpen] = useState(false)

  const links = [
    { href: "/local",        label: "📍 Local" },
    { href: "/scholarships", label: "🎓 Scholarships" },
    { href: "/trades",       label: "🔧 Trades" },
    { href: "/blog",         label: "✍️ Blog" },
    { href: "/about",        label: "About" },
  ]

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand" onClick={() => setOpen(false)}>
        <div className="navbar-logo">$</div>
        <div>
          <div className="navbar-site-name">
            LocalScholarships
            <span style={{ color: "#7eb8f7", fontWeight: 700 }}>.org</span>
          </div>
          <div className="navbar-tagline">Scholarship Directory</div>
        </div>
      </Link>

      {/* Desktop nav */}
      <div className="navbar-nav">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname.startsWith(l.href) ? "active" : ""}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <span className="navbar-count">{total}+ opportunities</span>

      {/* Hamburger button (mobile only) */}
      <button
        className="hamburger"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? "✕" : "≡"}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="mobile-nav">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname.startsWith(l.href) ? "active" : ""}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
