// check-titles.js — find duplicate title tags across all page types
// Run with: node --experimental-vm-modules check-titles.js
// or: npx tsx check-titles.js

const fs = require('fs')
const path = require('path')

// Parse RAW_SCHOLARSHIPS and RAW_LOCAL from lib/data.ts without executing TS
const src = fs.readFileSync(path.join(__dirname, 'lib/data.ts'), 'utf8')

function extractArray(name) {
  const start = src.indexOf(`const ${name}`)
  if (start === -1) return []
  let depth = 0, i = src.indexOf('[', start), begin = i
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++
    else if (src[i] === ']') { depth--; if (depth === 0) break }
  }
  const block = src.slice(begin, i + 1)
  // Strip TS type assertions and extract object literals
  const cleaned = block
    .replace(/\/\/[^\n]*/g, '')   // remove line comments
    .replace(/as const/g, '')
    .replace(/:\s*"[^"]*"/g, '')  // remove type annotations on properties - NO, those are values
  // Use a simple JSON-like extraction
  const entries = []
  const objRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
  let m
  while ((m = objRegex.exec(block)) !== null) {
    const obj = {}
    const body = m[1]
    // Extract key: "value" or key: number or key: true/false pairs
    const kvRegex = /(\w+)\s*:\s*(?:"((?:[^"\\]|\\.)*)"|(\d+(?:\.\d+)?(?:_\d+)*)|([a-z]+))/g
    let kv
    while ((kv = kvRegex.exec(body)) !== null) {
      const key = kv[1], strVal = kv[2], numVal = kv[3], boolVal = kv[4]
      if (strVal !== undefined) obj[key] = strVal
      else if (numVal !== undefined) obj[key] = Number(numVal.replace(/_/g,''))
      else if (boolVal !== undefined) obj[key] = boolVal === 'true'
    }
    if (obj.id !== undefined) entries.push(obj)
  }
  return entries
}

const SCHOLARSHIPS = extractArray('RAW_SCHOLARSHIPS')
const LOCAL_DATA = extractArray('RAW_LOCAL')

const SITE_NAME = 'LocalScholarships.org'
const template = t => `${t} | ${SITE_NAME}`

const titles = []

// /scholarships/[slug] — "${s.name} — ${s.amount}"
for (const s of SCHOLARSHIPS) {
  if (s.name && s.amount) {
    titles.push({ url: `/scholarships/${s.slug}`, title: template(`${s.name} — ${s.amount}`) })
  }
}

// /local/[state] — "${stateUpper} Scholarships & Local Foundations — ${total} Verified"
// (totals vary per state so unlikely to duplicate)

// /local/[state]/[slug] foundation pages — "${f.name} Scholarship — ${f.amount}"
for (const f of LOCAL_DATA) {
  if (f.name && f.amount) {
    titles.push({ url: `/local/${(f.state||'').toLowerCase()}/${f.slug}`, title: template(`${f.name} Scholarship — ${f.amount}`) })
  }
}

// Find duplicates
const seen = {}
const dupes = []
for (const { url, title } of titles) {
  if (!title) continue
  if (seen[title]) {
    dupes.push({ title, urls: [seen[title], url] })
  } else {
    seen[title] = url
  }
}

console.log(`\nChecked ${titles.length} page titles.\n`)
if (dupes.length === 0) {
  console.log('✓ No duplicate titles found.')
} else {
  console.log(`✗ ${dupes.length} duplicate title(s) found:\n`)
  for (const d of dupes) {
    console.log(`  TITLE: "${d.title}"`)
    for (const u of d.urls) console.log(`    → ${u}`)
    console.log()
  }
}
