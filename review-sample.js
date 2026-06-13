/**
 * review-sample.js
 * Prints N random entries from the filtered B82 set for spot-checking
 * before committing to lib/data.ts.
 *
 * Usage:
 *   node review-sample.js        # 20 random B82
 *   node review-sample.js 50     # 50 random B82
 *   node review-sample.js 20 T31 # 20 random T31/T30 community foundations
 */

const fs = require('fs')

const COUNT  = parseInt(process.argv[2]) || 20
const FILTER = (process.argv[3] || 'B82').toUpperCase()

const d = JSON.parse(fs.readFileSync('scraped-foundations-ntee.json'))

// Apply the same filters used for site import
const b82 = d.listings.filter(l => l.ntee_code === 'B82')
const t3x = d.listings.filter(l =>
  (l.ntee_code === 'T31' || l.ntee_code === 'T30') &&
  l.name.toLowerCase().includes('community foundation') &&
  (l.income_amount || 0) > 0
)

const pool = FILTER === 'T31' ? t3x : b82

// Fisher-Yates shuffle, take first N
const shuffled = [...pool]
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
}
const sample = shuffled.slice(0, COUNT)

console.log(`\n=== ${COUNT} random ${FILTER} entries (pool: ${pool.length}) ===\n`)

sample.forEach((f, i) => {
  console.log(`[${String(i + 1).padStart(2)}] ${f.name}`)
  console.log(`     State : ${f.state}  |  City: ${f.city}`)
  console.log(`     NTEE  : ${f.ntee_code}`)
  console.log(`     EIN   : ${f.ein}`)
  console.log(`     Income: ${f.income_amount != null ? '$' + f.income_amount.toLocaleString() : 'n/a'}`)
  console.log(`     Slug  : ${f.slug}`)
  console.log(`     URL   : ${f.url}`)
  console.log(`     Elig  : ${f.eligibility}`)
  console.log()
})

console.log(`Total in filtered set — B82: ${b82.length}, T31/T30: ${t3x.length}, combined: ${b82.length + t3x.length}`)
