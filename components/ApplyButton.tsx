"use client"
import { useState, useEffect } from "react"

const MONTH_IDX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

function parseMonDay(s: string): { mon: number; day: number } | null {
  const m = s.trim().match(/^([a-z]+)\s+(\d+)$/i)
  if (!m) return null
  const mon = MONTH_IDX[m[1].toLowerCase().slice(0, 3)]
  if (mon === undefined) return null
  return { mon, day: parseInt(m[2]) }
}

// Returns true if today is within [open, close] window, accounting for year wrap
function isWindowOpen(openStr: string, closeStr: string): boolean {
  const open = parseMonDay(openStr)
  const close = parseMonDay(closeStr)
  if (!open || !close) return true // can't parse → assume open

  const today = new Date()
  const tMon = today.getMonth()
  const tDay = today.getDate()

  const afterOpen = tMon > open.mon || (tMon === open.mon && tDay >= open.day)
  const beforeClose = tMon < close.mon || (tMon === close.mon && tDay <= close.day)

  if (open.mon > close.mon) {
    // Crosses year boundary (e.g. Dec 15 – Mar 15)
    return afterOpen || beforeClose
  }
  // Same-year range (e.g. Feb 1 – Apr 30)
  return afterOpen && beforeClose
}

// Returns true if today is past the single deadline date this year
function isPastDeadline(deadlineStr: string): boolean {
  const dl = deadlineStr.toLowerCase()
  if (!dl || dl.includes("rolling") || dl.includes("varies") || dl.includes("n/a")) return false
  const d = parseMonDay(deadlineStr)
  if (!d) return false
  const today = new Date()
  const closeDate = new Date(today.getFullYear(), d.mon, d.day)
  return today > closeDate
}

type Status = { open: true } | { open: false; buttonLabel: string }

function computeStatus(
  deadline: string,
  applicationOpen?: string,
  applicationClose?: string,
): Status {
  // Structured window: use application_open + application_close
  if (applicationOpen && applicationClose) {
    if (isWindowOpen(applicationOpen, applicationClose)) return { open: true }
    return { open: false, buttonLabel: `Applications Closed — Opens ${applicationOpen}` }
  }

  // application_open + deadline as close
  if (applicationOpen && deadline) {
    const dl = deadline.toLowerCase()
    if (dl.includes("rolling") || dl.includes("varies") || dl.includes("n/a")) return { open: true }
    if (isWindowOpen(applicationOpen, deadline)) return { open: true }
    return { open: false, buttonLabel: `Applications Closed — Opens ${applicationOpen}` }
  }

  // Deadline only
  const dl = deadline.toLowerCase()
  if (!dl || dl.includes("rolling") || dl.includes("varies") || dl.includes("n/a")) return { open: true }

  // Legacy range in deadline field e.g. "Dec 15 - Mar 15"
  const rangeMatch = deadline.match(/([a-z]+\s+\d+)\s*[-–]\s*([a-z]+\s+\d+)/i)
  if (rangeMatch) {
    if (isWindowOpen(rangeMatch[1], rangeMatch[2])) return { open: true }
    return { open: false, buttonLabel: `Applications Closed — Opens ${rangeMatch[1]}` }
  }

  if (isPastDeadline(deadline)) {
    return { open: false, buttonLabel: "Applications Closed — Visit Website" }
  }
  return { open: true }
}

type Props = {
  url: string
  deadline: string
  propublicaUrl?: string | null
  applicationOpen?: string
  applicationClose?: string
  accentColor?: string          // defaults to #2563eb (foundation blue)
  openLabel?: string            // defaults to "Apply Now"
}

export default function ApplyButton({
  url,
  deadline,
  propublicaUrl,
  applicationOpen,
  applicationClose,
  accentColor = "#2563eb",
  openLabel = "Apply Now",
}: Props) {
  // Start open to avoid SSR/hydration mismatch; updated after mount
  const [status, setStatus] = useState<Status>({ open: true })

  useEffect(() => {
    setStatus(computeStatus(deadline, applicationOpen, applicationClose))
  }, [deadline, applicationOpen, applicationClose])

  const isClosed = !status.open
  const buttonLabel = isClosed ? (status as { open: false; buttonLabel: string }).buttonLabel : openLabel
  const showWindow = applicationOpen && applicationClose

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: propublicaUrl ? "1fr 1fr" : "1fr",
        gap: "12px",
      }}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            background: isClosed ? "#6b7280" : accentColor,
            color: "white",
            textAlign: "center",
            padding: "14px",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: isClosed ? "13px" : "15px",
            lineHeight: 1.3,
            transition: "background 0.2s",
          }}
        >
          {buttonLabel}
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

      {/* Window note */}
      {showWindow && (
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#64748b", textAlign: "center" }}>
          Opens {applicationOpen} · Closes {applicationClose}
        </p>
      )}

      {/* Closed note */}
      {isClosed && (
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
