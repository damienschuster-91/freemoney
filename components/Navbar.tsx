"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SCHOLARSHIPS, LOCAL_DATA } from "@/lib/data"

export default function Navbar() {
  const pathname = usePathname()
  const total = SCHOLARSHIPS.length + LOCAL_DATA.length

  const links = [
    { href: "/scholarships", label: "🔍 Scholarships" },
    { href: "/local",        label: "📍 Local" },
    { href: "/blog",         label: "✍️ Blog" },
    { href: "/about",        label: "About" },
  ]

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <div className="navbar-logo">$</div>
        <div>
          <div className="navbar-site-name">Free Money</div>
          <div className="navbar-tagline">Scholarship Directory</div>
        </div>
      </Link>

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
    </nav>
  )
}
