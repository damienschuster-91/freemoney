"use client"
import { useState, useEffect } from "react"

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function parseMonIdx(s: string): number | null {
  const key = s.toLowerCase().slice(0, 3)
  return key in MONTHS ? MONTHS[key] : null
}

function checkDeadline(deadline: string): { closed: boolean; opensAgain: string | null } {
  const dl = deadline.toLowerCase()
  if (!dl || dl.includes("rolling") || dl.includes("varies") || dl.includes("n/a")) {
    return { closed: false, opensAgain: null }
  }

  const today = new Date()
  const year = today.getFullYear()

  // Range: "Dec 15 - Mar 15" or "Dec 15 – Mar 15"
  const rangeMatch = deadline.match(/([a-z]+)\s+(\d+)\s*[-–]\s*([a-z]+)\s+(\d+)/i)
  if (rangeMatch) {
    const openMonIdx = parseMonIdx(rangeMatch[1])
    const closeMonIdx = parseMonIdx(rangeMatch[3])
    const closeDay = parseInt(rangeMatch[4])
    if (closeMonIdx === null || openMonIdx === null) return { closed: false, opensAgain: null }
    const closeDate = new Date(year, closeMonIdx, closeDay)
    if (today > closeDate) {
      return { closed: true, opensAgain: MONTH_NAMES[openMonIdx] }
    }
    return { closed: false, opensAgain: null }
  }

  // Single date: "Mar 1", "Apr 30"
  const single = deadline.match(/([a-z]+)\s+(\d+)/i)
  if (single) {
    const monIdx = parseMonIdx(single[1])
    const day = parseInt(single[2])
    if (monIdx === null) return { closed: false, opensAgain: null }
    const closeDate = new Date(year, monIdx, day)
    if (today > closeDate) {
      return { closed: true, opensAgain: `${MONTH_NAMES[monIdx]} ${year + 1}` }
    }
    return { closed: false, opensAgain: null }
  }

  return { closed: false, opensAgain: null }
}

type Props = {
  url: string
  deadline: string
  propublicaUrl: string | null
}

export default function ApplyButton({ url, deadline, propublicaUrl }: Props) {
  // Start open (avoids SSR/hydration mismatch); update after mount
  const [status, setStatus] = useState<{ closed: boolean; opensAgain: string | null }>({
    closed: false,
    opensAgain: null,
  })

  useEffect(() => {
    setStatus(checkDeadline(deadline))
  }, [deadline])

  return (
    <div style={{ display: "grid", gridTemplateColumns: propublicaUrl ? "1fr 1fr" : "1fr", gap: "12px", marginTop: "8px" }}>
      <div>
        {status.closed ? (
          <div
            style={{
              display: "block", background: "#94a3b8", color: "white",
              textAlign: "center", padding: "14px", borderRadius: "10px",
              fontWeight: 700, fontSize: "15px", cursor: "default",
            }}
          >
            Applications Closed
          </div>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block", background: "#2563eb", color: "white",
              textAlign: "center", padding: "14px", borderRadius: "10px",
              textDecoration: "none", fontWeight: 700, fontSize: "15px",
            }}
          >
            Apply Now
          </a>
        )}
        {status.closed && status.opensAgain && (
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#64748b", textAlign: "center" }}>
            Opens again {status.opensAgain}
          </p>
        )}
      </div>

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
  )
}
