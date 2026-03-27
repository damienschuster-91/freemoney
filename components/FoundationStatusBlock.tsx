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
  const afterOpen   = tM > open.mon  || (tM === open.mon  && tD >= open.day)
  const beforeClose = tM < close.mon || (tM === close.mon && tD <= close.day)
  return open.mon > close.mon ? (afterOpen || beforeClose) : (afterOpen && beforeClose)
}

function deadlineOpen(dl: string): boolean {
  const s = dl.toLowerCase()
  if (!s || s.includes("rolling") || s.includes("varies") || s.includes("n/a")) return true
  const range = dl.match(/([a-z]+\s+\d+)\s*[-–]\s*([a-z]+\s+\d+)/i)
  if (range) return windowIsOpen(range[1], range[2])
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
}

export default function FoundationStatusBlock({ url, propublicaUrl, deadline, applicationOpen, applicationClose }: Props) {
  const [open, setOpen] = useState(true)

  useEffect(() => {
    setOpen(applicationOpen && applicationClose
      ? windowIsOpen(applicationOpen, applicationClose)
      : deadlineOpen(deadline))
  }, [deadline, applicationOpen, applicationClose])

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      {/* Status banner */}
      <div style={{
        background: open ? "#f0fdf4" : "#f1f5f9",
        borderBottom: `1px solid ${open ? "#bbf7d0" : "#e2e8f0"}`,
        padding: "12px 20px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: open ? "#16a34a" : "#9ca3af",
          display: "inline-block", flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: open ? "#15803d" : "#6b7280", letterSpacing: "0.01em" }}>
          {open ? "Now Accepting Applications" : "Applications Closed"}
        </span>
      </div>

      {/* Buttons */}
      <div style={{
        background: "white", padding: "16px 20px",
        display: "grid", gridTemplateColumns: propublicaUrl ? "1fr 1fr" : "1fr", gap: 10,
      }}>
        <a
          href={url} target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: open ? "#1a3a6b" : "#4b5563",
            color: "white", textDecoration: "none",
            padding: "12px 18px", borderRadius: 9,
            fontWeight: 700, fontSize: 14,
          }}
        >
          {open ? "Apply Now →" : "Visit Website →"}
        </a>
        {propublicaUrl && (
          <a
            href={propublicaUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "white", color: "#374151",
              border: "1.5px solid #d1d5db", textDecoration: "none",
              padding: "12px 18px", borderRadius: 9,
              fontWeight: 600, fontSize: 14,
            }}
          >
            View 990 Filing
          </a>
        )}
      </div>
    </div>
  )
}
