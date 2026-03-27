"use client"
import { useState, useEffect } from "react"

const MONTH_IDX: Record<string, number> = {
  jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
  jul:6, aug:7, sep:8, oct:9, nov:10, dec:11,
}

function parseMonDay(s: string): { mon: number; day: number } | null {
  const m = s.trim().match(/^([a-z]+)\s+(\d+)$/i)
  if (!m) return null
  const mon = MONTH_IDX[m[1].toLowerCase().slice(0, 3)]
  if (mon === undefined) return null
  return { mon, day: parseInt(m[2]) }
}

function windowIsOpen(openStr: string, closeStr: string): boolean {
  const open = parseMonDay(openStr)
  const close = parseMonDay(closeStr)
  if (!open || !close) return true
  const t = new Date()
  const tM = t.getMonth(), tD = t.getDate()
  const afterOpen  = tM > open.mon  || (tM === open.mon  && tD >= open.day)
  const beforeClose = tM < close.mon || (tM === close.mon && tD <= close.day)
  return open.mon > close.mon ? (afterOpen || beforeClose) : (afterOpen && beforeClose)
}

function deadlineOpen(dl: string): boolean {
  const s = dl.toLowerCase()
  if (!s || s.includes("rolling") || s.includes("varies") || s.includes("n/a")) return true
  const rangeMatch = dl.match(/([a-z]+\s+\d+)\s*[-–]\s*([a-z]+\s+\d+)/i)
  if (rangeMatch) return windowIsOpen(rangeMatch[1], rangeMatch[2])
  const d = parseMonDay(dl)
  if (!d) return true
  const today = new Date()
  return today <= new Date(today.getFullYear(), d.mon, d.day)
}

type Props = {
  url: string
  propublicaUrl: string | null
  deadline: string
  applicationOpen?: string
  applicationClose?: string
  awardsAnnounced?: string
}

export default function FoundationStatusBlock({
  url, propublicaUrl, deadline,
  applicationOpen, applicationClose, awardsAnnounced,
}: Props) {
  const [open, setOpen] = useState(true) // SSR-safe default

  useEffect(() => {
    if (applicationOpen && applicationClose) {
      setOpen(windowIsOpen(applicationOpen, applicationClose))
    } else {
      setOpen(deadlineOpen(deadline))
    }
  }, [deadline, applicationOpen, applicationClose])

  const hasWindow = applicationOpen && applicationClose

  return (
    <div style={{
      background: "white",
      borderRadius: "14px",
      border: `1.5px solid ${open ? "#bbf7d0" : "#e2e8f0"}`,
      padding: "24px 28px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Status label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: open ? "#f0fdf4" : "#f1f5f9",
          color: open ? "#15803d" : "#6b7280",
          fontSize: 13, fontWeight: 700,
          padding: "5px 14px", borderRadius: 999,
          border: `1px solid ${open ? "#bbf7d0" : "#e2e8f0"}`,
        }}>
          <span style={{ fontSize: 8 }}>{open ? "●" : "○"}</span>
          {open ? "Now Accepting Applications" : "Applications Closed"}
        </span>
      </div>

      {/* Date line */}
      <div style={{ fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 1.5 }}>
        {hasWindow ? (
          <>
            Opens {applicationOpen} &mdash; Closes {applicationClose}
            {awardsAnnounced && <> &mdash; Awards: {awardsAnnounced}</>}
          </>
        ) : (
          <>Deadline: {deadline}</>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center",
            background: open ? "#2563eb" : "#6b7280",
            color: "white", textDecoration: "none",
            padding: "12px 22px", borderRadius: "10px",
            fontWeight: 700, fontSize: 14, whiteSpace: "nowrap",
          }}
        >
          {open ? "Apply Now →" : "Visit Website →"}
        </a>
        {propublicaUrl && (
          <a
            href={propublicaUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center",
              background: "#f8fafc", color: "#475569",
              border: "1.5px solid #e2e8f0", textDecoration: "none",
              padding: "12px 22px", borderRadius: "10px",
              fontWeight: 600, fontSize: 14, whiteSpace: "nowrap",
            }}
          >
            View 990 Filing
          </a>
        )}
      </div>
    </div>
  )
}
