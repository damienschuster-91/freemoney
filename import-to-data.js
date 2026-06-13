/**
 * import-to-data.js
 * Filters scraped-foundations-ntee.json and appends new entries
 * to the RAW_LOCAL array in lib/data.ts.
 *
 * Filters applied:
 *   1. NTEE B82 (exact) — all, with name-quality guard
 *   2. T31/T30 + "community foundation" in name + income_amount > 0
 *   3. Deduplicate by EIN against entries already in lib/data.ts
 *
 * Usage: node import-to-data.js [--dry-run]
 */

const fs = require('fs')

const DRY_RUN = process.argv.includes('--dry-run')

// --- Filters -----------------------------------------------------------------

const QUALITY_TERMS = [
  'scholarship','fund','foundation','education','academic',
  'fellowship','grant','bursary','award','endowment','trust',
  'school','college','university','student','learning','training',
  'career','vocational',
]
const nameOk = name => QUALITY_TERMS.some(t => name.toLowerCase().includes(t))

const d = JSON.parse(fs.readFileSync('scraped-foundations-ntee.json'))

const b82 = d.listings.filter(l => l.ntee_code === 'B82' && nameOk(l.name))

const t3x = d.listings.filter(l =>
  (l.ntee_code === 'T31' || l.ntee_code === 'T30') &&
  l.name.toLowerCase().includes('community foundation') &&
  (l.income_amount || 0) > 0
)

// Merge, deduplicate by EIN within scraped set
const byEin = new Map()
for (const f of [...b82, ...t3x]) byEin.set(f.ein, f)

// --- Deduplicate against existing lib/data.ts EINs --------------------------

const dataPath = 'lib/data.ts'
const original = fs.readFileSync(dataPath, 'utf8')

const existingEins = new Set(
  [...original.matchAll(/organizations\/(\d+)/g)].map(m => m[1])
)

const fresh = [...byEin.values()].filter(f => !existingEins.has(f.ein))

console.log(`B82 (name-filtered):     ${b82.length}`)
console.log(`T31/T30 (name+income):   ${t3x.length}`)
console.log(`Combined unique:         ${byEin.size}`)
console.log(`Already in data.ts:      ${byEin.size - fresh.length}`)
console.log(`Net new entries:         ${fresh.length}`)

if (!fresh.length) {
  console.log('Nothing to add.')
  process.exit(0)
}

// --- Format entries ----------------------------------------------------------

function escStr(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function formatEntry(f) {
  const tags = (f.tags || ['community','local','need-based'])
    .map(t => `"${escStr(t)}"`)
    .join(',')
  return (
    `  { id:"${escStr(f.id)}", name:"${escStr(f.name)}", state:"${escStr(f.state)}", ` +
    `county:"${escStr(f.city || f.state)}", city:"${escStr(f.city || '')}", ` +
    `amount:"$500\u2013$5,000", deadline:"Varies", ` +
    `eligibility:"${escStr(f.eligibility)}", ` +
    `url:"${escStr(f.url)}", ` +
    `propublica_url:"${escStr(f.propublica_url)}", ` +
    `tags:[${tags}] },`
  )
}

const newLines = fresh.map(formatEntry).join('\n')

// --- Splice into data.ts -----------------------------------------------------
// Find the closing bracket of RAW_LOCAL (the `]` on its own line after the last entry)

const RAW_LOCAL_END = /^(\])\s*$/m
const match = RAW_LOCAL_END.exec(original)
if (!match) {
  console.error('Could not find closing ] of RAW_LOCAL in lib/data.ts')
  process.exit(1)
}

const insertAt = match.index  // position of the `]`
const updated =
  original.slice(0, insertAt) +
  newLines + '\n' +
  original.slice(insertAt)

// Sanity check: count entries before and after
const before = (original.match(/{ id:/g) || []).length
const after  = (updated.match(/{ id:/g) || []).length
console.log(`\nEntries in data.ts before: ${before}`)
console.log(`Entries in data.ts after:  ${after}`)
console.log(`Delta:                     ${after - before}`)

if (after - before !== fresh.length) {
  console.error(`ERROR: delta mismatch (expected ${fresh.length}). Aborting.`)
  process.exit(1)
}

if (DRY_RUN) {
  console.log('\n--dry-run: file not written. First 3 new entries:')
  fresh.slice(0, 3).forEach(f => console.log(' ', formatEntry(f)))
} else {
  // Backup first
  fs.writeFileSync(dataPath + '.bak', original)
  fs.writeFileSync(dataPath, updated)
  console.log(`\nWritten to ${dataPath}  (backup → ${dataPath}.bak)`)
}
