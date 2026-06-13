/**
 * manual-research-queue.js
 * Outputs the 443 T31/T30 community foundations as a CSV
 * for manual research of real scholarship application URLs.
 *
 * Output: research-queue.csv (ein, name, city, state, propublica_url)
 * Sorted by state, then name.
 */

const fs = require('fs')

const d = JSON.parse(fs.readFileSync('scraped-foundations-ntee.json'))

const foundations = d.listings
  .filter(l =>
    (l.ntee_code === 'T31' || l.ntee_code === 'T30') &&
    l.name.toLowerCase().includes('community foundation') &&
    (l.income_amount || 0) > 0
  )
  .sort((a, b) => {
    const s = a.state.localeCompare(b.state)
    return s !== 0 ? s : a.name.localeCompare(b.name)
  })

const escape = v => `"${String(v || '').replace(/"/g, '""')}"`

const header = 'ein,name,city,state,propublica_url'
const rows = foundations.map(f =>
  [f.ein, f.name, f.city, f.state, f.propublica_url].map(escape).join(',')
)

const csv = [header, ...rows].join('\n')
fs.writeFileSync('research-queue.csv', csv)

console.log(`Wrote ${foundations.length} entries to research-queue.csv`)
console.log(`States covered: ${[...new Set(foundations.map(f => f.state))].sort().join(', ')}`)
