"use client"
import { useState, useEffect } from "react"

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

function parseMonIdx(s: string): number | null {
  const key = s.toLowerCase().slice(0, 3)
  return key in MONTHS ? MONTHS[key] : null
}

type Status = { closed: false } | { closed: true; buttonLabel: string }

function checkDeadline(deadline: string): Status {
  const dl = deadline.toLowerCase()
  if (!dl || dl.includes("rolling") || dl.includes("varies") || dl.includes("n/a")) {
    return { closed: false }
  }

  const today = new Date()
  const todayMon = today.getMonth()
  const todayDay = today.getDate()

  // Range: "Dec 15 - Mar 15" or "Dec 15 – Mar 15"
  const rangeMatch = deadline.match(/([a-z]+)\s+(\d+)\s*[-–]\s*([a-z]+)\s+(\d+)/i)
  if (rangeMatch) {
    const openMonIdx = parseMonIdx(rangeMatch[1])
    const openDay = parseInt(rangeMatch[2])
    const closeMonIdx = parseMonIdx(rangeMatch[3])
    const closeDay = parseInt(rangeMatch[4])
    if (openMonIdx === null || closeMonIdx === null) return { closed: false }

    let isOpen: boolean
    if (openMonIdx > closeMonIdx) {
      // Crosses year boundary (e.g. Dec–Mar): open if past open date OR before close date
      const pastOpen = todayMon > openMonIdx || (todayMon === openMonIdx && todayDay >= openDay)
      const beforeClose = todayMon < closeMonIdx || (todayMon === closeMonIdx && todayDay <= closeDay)
      isOpen = pastOpen || beforeClose
    } else {
      // Same-year range (e.g. Feb–Apr): open if within both bounds
      const pastOpen = todayMon > openMonIdx || (todayMon === openMonIdx && todayDay >= openDay)
      const beforeClose = todayMon < closeMonIdx || (todayMon === closeMonIdx && todayDay <= closeDay)
      isOpen = pastOpen && beforeClose
    }

    if (isOpen) return { closed: false }
    return { closed: true, buttonLabel: `Applications Closed — Opens ${SHORT_MONTHS[openMonIdx]} ${openDay}` }
  }

  // Single date: "Mar 1", "Apr 30"
  const single = deadline.match(/([a-z]+)\s+(\d+)/i)
  if (single) {
    const monIdx = parseMonIdx(single[1])
    const day = parseInt(single[2])
    if (monIdx === null) return { closed: false }
    const year = today.getFullYear()
    const closeDate = new Date(year, monIdx, day)
    if (today > closeDate) {
      return { closed: true, buttonLabel: "Applications Closed — Visit Website" }
    }
    return { closed: false }
  }

  return { closed: false }
}

type Props = {
  url: string
  deadline: string
  propublicaUrl: string | null
}

export default function ApplyButton({ url, deadline, propublicaUrl }: Props) {
  // Start open to avoid SSR/hydration mismatch; updated after mount
  const [status, setStatus] = useState<Status>({ closed: false })

  useEffect(() => {
    setStatus(checkDeadline(deadline))
  }, [deadline])

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "grid", gridTemplateColumns: propublicaUrl ? "1fr 1fr" : "1fr", gap: "12px" }}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            background: status.closed ? "#6b7280" : "#2563eb",
            color: "white",
            textAlign: "center",
            padding: "14px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: status.closed ? "13px" : "15px",
            lineHeight: 1.3,
            transition: "background 0.2s",
          }}
        >
          {status.closed ? status.buttonLabel : "Apply Now"}
        </a>

        {propublicaUrl && (
          <a
            href={propublicaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block", background: "#f8fafc", color: "#475569",
              textAlign: "center", padding: "14px", borderRadius: "10px",
              textDecoration: "none", fontWeight: 600, fontSize: "15px",
              border: "1px solid #e2e8f0",
            }}
          >
            View 990 Filing
          </a>
        )}
      </div>

      {status.closed && (
        <p style={{
          margin: "10px 0 0", fontSize: "12px", color: "#6b7280",
          lineHeight: 1.6, padding: "10px 12px",
          background: "#f9fafb", borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}>
          Applications are currently closed. Visit the foundation&apos;s website to learn about
          scholarships and check back when the next cycle opens.
        </p>
      )}
    </div>
  )
}
