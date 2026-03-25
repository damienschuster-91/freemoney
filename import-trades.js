/**
 * import-trades.js
 * Imports trade-school-opportunities.csv into RAW_SCHOLARSHIPS in lib/data.ts.
 * - Type "Grant" rows → category "grant"
 * - All other rows     → category "trade"
 * Deduplicates against existing entries by application_url.
 */

const fs = require('fs')
const path = require('path')

// --- Parse CSV (no external deps) ---
function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = parseCSVRow(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseCSVRow(line)
    const obj = {}
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] || '').trim() })
    return obj
  }).filter(r => r.name)
}

function parseCSVRow(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// --- Helpers ---
function parseAmount(notes) {
  // "40 awards of $5,000" -> "$5,000"
  const awardOf = notes.match(/\d+\s+awards?\s+of\s+(\$[\d,]+)/)
  if (awardOf) return awardOf[1]
  // "Up to $X,XXX" or "$X-$Y" → first match
  const upTo = notes.match(/[Uu]p\s+to\s+(\$[\d,.]+[MKk]?)/)
  if (upTo) return `Up to ${upTo[1]}`
  // "$X,XXX/yr" or "$X,XXX"
  const dollar = notes.match(/(\$[\d,.]+(?:\/yr|[KkMm])?(?:\s*-\s*\$[\d,.]+(?:\/yr)?)?)/)
  if (dollar) return dollar[1].replace(/\s+/g, '')
  return 'Varies'
}

function parseDeadline(notes) {
  // "deadline Feb 28 2026" or "deadline Jun 15 2026"
  const dl = notes.match(/deadline\s+([A-Z][a-z]+)\s+(\d+)/i)
  if (dl) return `${dl[1].slice(0,3)} ${dl[2]}`
  // "opens Feb 1 2026"
  const op = notes.match(/opens\s+([A-Z][a-z]+)\s+(\d+)/i)
  if (op) return `${op[1].slice(0,3)} ${op[2]}`
  // "deadlines Jun 1 and Oct 1" → first
  const multi = notes.match(/deadlines?\s+([A-Z][a-z]+)\s+(\d+)/i)
  if (multi) return `${multi[1].slice(0,3)} ${multi[2]}`
  return 'Varies'
}

function parseTags(csvCategory, type) {
  const tags = []
  const cat = csvCategory.toLowerCase()
  if (cat.includes('veteran') || cat.includes('military')) tags.push('veterans', 'military')
  if (cat.includes('construction')) tags.push('construction')
  if (cat.includes('plumbing')) tags.push('plumbing')
  if (cat.includes('hvac')) tags.push('hvac')
  if (cat.includes('welding')) tags.push('welding')
  if (cat.includes('electrical')) tags.push('electrical')
  if (cat.includes('manufacturing') || cat.includes('cnc') || cat.includes('machining')) tags.push('manufacturing')
  if (cat.includes('automotive') || cat.includes('diesel')) tags.push('automotive')
  if (type.toLowerCase().includes('apprenticeship')) tags.push('apprenticeship', 'paid')
  // all get "trades" tag unless already grant
  if (!tags.includes('trades')) tags.push('trades')
  return tags
}

function parseEligibility(row) {
  const type = row.type.toLowerCase()
  const cat = row.category
  if (type.includes('apprenticeship')) return `Paid apprenticeship program in ${cat}`
  if (row.type === 'Grant') return `${row.name} — check studentaid.gov or va.gov for eligibility`
  return `Students pursuing ${cat} programs or careers`
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function normalizeName(s) {
  return s.toLowerCase()
    .replace(/\b(foundation|scholarship|scholarships|association|program|fund|inc|the|of|for|and|&)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// --- Load existing data ---
const dataPath = path.join(__dirname, 'lib', 'data.ts')
const src = fs.readFileSync(dataPath, 'utf8')

// Extract existing URLs for dedup
const existingUrls = new Set()
for (const m of src.matchAll(/url:"([^"]+)"/g)) existingUrls.add(m[1])
for (const m of src.matchAll(/url: "([^"]+)"/g)) existingUrls.add(m[1])

// Extract existing names (normalized) for name-based dedup
const existingNames = new Set()
for (const m of src.matchAll(/name:"([^"]+)"/g)) existingNames.add(normalizeName(m[1]))
for (const m of src.matchAll(/name: "([^"]+)"/g)) existingNames.add(normalizeName(m[1]))

// Find highest ID
const allIds = [...src.matchAll(/\bid:(\d+)/g)].map(m => parseInt(m[1]))
const maxId = Math.max(...allIds)
console.log(`Highest existing ID: ${maxId}`)

// --- Parse CSV ---
const csvText = fs.readFileSync(path.join(__dirname, 'trade-school-opportunities.csv'), 'utf8')
const rows = parseCSV(csvText)
console.log(`CSV rows: ${rows.length}`)

// --- Build new entries ---
let nextId = maxId + 1
const added = []
const skipped = []

for (const row of rows) {
  const url = row.application_url || row.website
  if (!url) { skipped.push(`${row.name} — no URL`); continue }

  // Deduplicate by URL (normalize trailing slashes for comparison)
  const normalizedUrl = url.replace(/\/$/, '')
  const urlMatch = [...existingUrls].some(u => u.replace(/\/$/, '') === normalizedUrl)
  if (urlMatch) { skipped.push(`${row.name} — URL already in data`); continue }

  // Deduplicate by website domain (same org, different URL path)
  let csvDomain = ''
  try { csvDomain = new URL(row.website || url).hostname.replace(/^www\./, '') } catch {}
  const domainMatch = csvDomain && [...existingUrls].some(u => {
    try { return new URL(u).hostname.replace(/^www\./, '') === csvDomain } catch { return false }
  })
  if (domainMatch) { skipped.push(`${row.name} — domain already in data (${csvDomain})`); continue }

  // Deduplicate by normalized name
  const normName = normalizeName(row.name)
  const nameMatch = [...existingNames].some(n => {
    // Check if either contains the other (handles "NAWIC Founders Scholarship" vs "NAWIC Founders' Scholarship")
    return n === normName || n.includes(normName) || normName.includes(n)
  })
  if (nameMatch) { skipped.push(`${row.name} — name already in data`); continue }

  // Add to existingNames/Urls to prevent self-dedup within the CSV
  existingUrls.add(url)
  existingNames.add(normName)

  const category = row.type === 'Grant' ? 'grant' : 'trade'
  const amount = parseAmount(row.notes || '')
  const deadline = parseDeadline(row.notes || '')
  const tags = parseTags(row.category, row.type)
  const eligibility = parseEligibility(row)

  const entry = {
    id: nextId++,
    name: row.name,
    category,
    amount,
    deadline,
    gpa: 'Any',
    renewable: false,
    url,
    tags,
    eligibility,
  }
  added.push(entry)
}

console.log(`\nEntries to add: ${added.length}`)
console.log(`Skipped (duplicates / no URL): ${skipped.length}`)
skipped.forEach(s => console.log('  SKIP:', s))

if (added.length === 0) {
  console.log('Nothing to add.')
  process.exit(0)
}

// --- Format entries as TS lines ---
function fmtEntry(e) {
  const tags = `["${e.tags.join('","')}"]`
  // pad fields to align roughly with existing style (note: padEnd pads the quoted string + trailing comma)
  const namePad = (`"${e.name}",`).padEnd(60)
  const catPad  = (`"${e.category}",`).padEnd(16)
  const amtPad  = (`"${e.amount}",`).padEnd(34)
  const dlPad   = (`"${e.deadline}",`).padEnd(20)
  return `  { id:${e.id}, name:${namePad} category:${catPad} amount:${amtPad} deadline:${dlPad} gpa:"Any",   renewable:false, url:"${e.url}", tags:${tags}, eligibility:"${e.eligibility}" },`
}

const newLines = added.map(fmtEntry).join('\n')

// --- Find insertion point: end of RAW_SCHOLARSHIPS array ---
const rawSchStart = src.indexOf('const RAW_SCHOLARSHIPS = [')
if (rawSchStart === -1) { console.error('Could not find RAW_SCHOLARSHIPS'); process.exit(1) }

// Find the closing ] of RAW_SCHOLARSHIPS (search from start of that array)
const afterOpen = src.indexOf('[', rawSchStart) + 1
let depth = 1
let insertPos = -1
for (let i = afterOpen; i < src.length; i++) {
  if (src[i] === '[') depth++
  else if (src[i] === ']') {
    depth--
    if (depth === 0) { insertPos = i; break }
  }
}
if (insertPos === -1) { console.error('Could not find closing ] of RAW_SCHOLARSHIPS'); process.exit(1) }

// Insert before the closing ]
const updated = src.slice(0, insertPos) + newLines + '\n' + src.slice(insertPos)

// Sanity check
const before = (src.match(/^\s+\{ id:\d+/gm) || []).length
const after  = (updated.match(/^\s+\{ id:\d+/gm) || []).length
console.log(`\nEntries before: ${before}`)
console.log(`Entries added:  ${added.length}`)
console.log(`Entries after:  ${after}`)

if (after - before !== added.length) {
  console.error(`ERROR: count mismatch — expected +${added.length}, got +${after - before}`)
  process.exit(1)
}

fs.writeFileSync(dataPath + '.bak', src)
fs.writeFileSync(dataPath, updated)
console.log('\nDone. lib/data.ts updated (backup -> lib/data.ts.bak)')

// Summary of added entries
console.log('\nAdded entries:')
added.forEach(e => console.log(`  [${e.id}] ${e.name} (${e.category}) — ${e.amount} — ${e.deadline}`))
