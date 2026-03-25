/**
 * import-researched.js
 * Reads research-queue.csv, filters to rows with a scholarship_url,
 * converts to RAW_LOCAL format, deduplicates against lib/data.ts by EIN,
 * and appends net new entries.
 */

const fs = require('fs')

// ---- CSV parser (no deps) ---------------------------------------------------
function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = parseRow(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseRow(line)
    const row = {}
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim() })
    return row
  })
}

function parseRow(line) {
  const cols = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && !inQ)            { inQ = true }
    else if (ch === '"' && inQ) {
      if (line[i+1] === '"')           { cur += '"'; i++ }  // escaped quote
      else                             { inQ = false }
    } else if (ch === ',' && !inQ)     { cols.push(cur); cur = '' }
    else                               { cur += ch }
  }
  cols.push(cur)
  return cols
}

// ---- Helpers ----------------------------------------------------------------
function escStr(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

// Try to pull a deadline from the notes field.
// Looks for patterns like "Jan 15", "March 1", "mid-April", "Oct 1", etc.
function extractDeadline(notes) {
  if (!notes) return 'Varies'
  const months = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?'
  // "Jan 15", "March 1", "Jan 15-Mar 15" (take first date)
  const m = notes.match(new RegExp(`(${months})\\.?\\s+(\\d{1,2})`, 'i'))
  if (m) return `${m[1]} ${m[2]}`
  // "mid-April", "late March"
  const m2 = notes.match(new RegExp(`(mid|late|early)[-\\s]+(${months})`, 'i'))
  if (m2) return `${m2[1]} ${m2[2]}`
  return 'Varies'
}

// Try to pull an amount range from the notes field.
function extractAmount(notes) {
  if (!notes) return '$500-$5,000'
  // "$1,000-$5,000", "$500 to $3,000"
  const m = notes.match(/\$[\d,]+\s*(?:-|to)\s*\$[\d,]+/i)
  if (m) return m[0].replace(/\s+/g, '')
  // "up to $X,XXX"
  const m2 = notes.match(/up to \$[\d,]+/i)
  if (m2) return m2[0]
  // single amount like "$2,500"
  const m3 = notes.match(/\$([\d,]{3,})/i)
  if (m3) return `Up to ${m3[0]}`
  return '$500-$5,000'
}

// Build eligibility string from city, state, and notes
function buildEligibility(row) {
  const base = `${row.city}, ${row.state} area residents`
  if (row.notes) {
    // Trim notes to a useful length, strip semicolons for flow
    const clean = row.notes.replace(/;/g, '.').replace(/\s{2,}/g, ' ').trim()
    const snippet = clean.length > 120 ? clean.slice(0, 120).replace(/\s\S+$/, '') + '...' : clean
    return `${base} - ${snippet}`
  }
  return `${base} - verify current eligibility at scholarship website`
}

// ---- Main -------------------------------------------------------------------
const rows = parseCSV(fs.readFileSync('research-queue.csv', 'utf8'))
const withUrl = rows.filter(r => r.scholarship_url && r.scholarship_url.trim())

console.log(`Total CSV rows:        ${rows.length}`)
console.log(`With scholarship_url:  ${withUrl.length}`)

// Extract existing EINs from lib/data.ts
const dataPath = 'lib/data.ts'
const original = fs.readFileSync(dataPath, 'utf8')
const existingEins = new Set(
  [...original.matchAll(/organizations\/(\d+)/g)].map(m => m[1])
)

// Also check id:"pp-{ein}" pattern
const existingPPIds = new Set(
  [...original.matchAll(/id:"pp-(\d+)"/g)].map(m => m[1])
)

const fresh = withUrl.filter(r => {
  const ein = r.ein.trim()
  return !existingEins.has(ein) && !existingPPIds.has(ein)
})

console.log(`Already in lib/data.ts: ${withUrl.length - fresh.length}`)
console.log(`Net new entries:        ${fresh.length}`)

if (!fresh.length) {
  console.log('Nothing to add.')
  process.exit(0)
}

// Format each entry
function formatEntry(r) {
  const ein    = r.ein.trim()
  const name   = r.name.trim()
  const state  = r.state.trim().toUpperCase()
  const city   = r.city.trim()
  const url    = r.scholarship_url.trim()
  const ppUrl  = r.propublica_url.trim()
  const amount = extractAmount(r.notes)
  const deadline = extractDeadline(r.notes)
  const eligibility = buildEligibility(r)

  return (
    `  { id:"pp-${escStr(ein)}", name:"${escStr(name)}", state:"${state}", ` +
    `county:"${escStr(city)}", city:"${escStr(city)}", ` +
    `amount:"${escStr(amount)}", deadline:"${escStr(deadline)}", ` +
    `eligibility:"${escStr(eligibility)}", ` +
    `url:"${escStr(url)}", ` +
    `propublica_url:"${escStr(ppUrl)}", ` +
    `tags:["community","local","need-based"] },`
  )
}

const newLines = fresh.map(formatEntry).join('\n')

// Insert before the closing ] of RAW_LOCAL specifically
const rawLocalStart = original.indexOf('const RAW_LOCAL = [')
if (rawLocalStart === -1) { console.error('Cannot find RAW_LOCAL in lib/data.ts'); process.exit(1) }
const afterRawLocal = original.slice(rawLocalStart)
const closingOffset = /^(\])\s*$/m.exec(afterRawLocal)
if (!closingOffset) { console.error('Cannot find RAW_LOCAL closing ] in lib/data.ts'); process.exit(1) }
const match = { index: rawLocalStart + closingOffset.index }

const updated = original.slice(0, match.index) + newLines + '\n' + original.slice(match.index)

const before = (original.match(/{ id:/g) || []).length
const after  = (updated.match(/{ id:/g) || []).length
if (after - before !== fresh.length) {
  console.error(`Delta mismatch: expected ${fresh.length}, got ${after - before}`)
  process.exit(1)
}

fs.writeFileSync(dataPath + '.bak', original)
fs.writeFileSync(dataPath, updated)

console.log(`\nAdded ${fresh.length} entries to lib/data.ts (backup -> lib/data.ts.bak)`)
console.log('\nSample entries added:')
fresh.slice(0, 3).forEach(r => console.log(`  [${r.state}] ${r.name} -> ${r.scholarship_url}`))
