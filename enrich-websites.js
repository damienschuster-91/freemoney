/**
 * enrich-websites.js
 * Fetches org detail from ProPublica for each filtered foundation
 * and adds website URL. Saves to enriched-foundations-ntee.json.
 */

const https = require('https')
const fs    = require('fs')

const QUALITY_TERMS = ['scholarship','fund','foundation','education','academic','fellowship','grant','bursary','award','endowment','trust','school','college','university','student','learning','training','career','vocational']
const nameOk = name => QUALITY_TERMS.some(t => name.toLowerCase().includes(t))

function get(url) {
  return new Promise(resolve => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'FreeMoney/1.0', 'Accept': 'application/json' }
    }, res => {
      let b = ''; res.on('data', c => b += c)
      res.on('end', () => { try { resolve(JSON.parse(b)) } catch { resolve(null) } })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(12000, () => { req.destroy(); resolve(null) })
  })
}

async function main() {
  const d = JSON.parse(fs.readFileSync('scraped-foundations-ntee.json'))

  const b82 = d.listings.filter(l => l.ntee_code === 'B82' && nameOk(l.name))
  const t3x = d.listings.filter(l =>
    (l.ntee_code === 'T31' || l.ntee_code === 'T30') &&
    l.name.toLowerCase().includes('community foundation') &&
    (l.income_amount || 0) > 0
  )
  const byEin = new Map()
  for (const f of [...b82, ...t3x]) byEin.set(f.ein, f)
  const pool = [...byEin.values()]

  console.log(`Fetching org detail for ${pool.length} foundations...`)
  console.log('Estimated time: ~17 min at 150ms/call\n')

  let withWebsite = 0
  const enriched = []

  for (let i = 0; i < pool.length; i++) {
    const f = { ...pool[i] }
    const data = await get(`https://projects.propublica.org/nonprofits/api/v2/organizations/${f.ein}.json`)
    const org  = data?.organization

    if (org) {
      const site = (org.website || '').trim()
      if (site) {
        f.website_url = site.startsWith('http') ? site : 'https://' + site
        withWebsite++
      }
      // Grab income/asset while we're here (may be populated now)
      if (!f.income_amount && org.income_amount) f.income_amount = org.income_amount
    }

    enriched.push(f)

    if ((i + 1) % 100 === 0 || i === pool.length - 1) {
      process.stdout.write(`\r[${i + 1}/${pool.length}] with website: ${withWebsite}`)
    }
    await new Promise(r => setTimeout(r, 150))
  }

  console.log('\n')

  fs.writeFileSync('enriched-foundations-ntee.json', JSON.stringify({
    meta: {
      enriched_at:   new Date().toISOString(),
      total:         enriched.length,
      with_website:  withWebsite,
    },
    listings: enriched,
  }, null, 2))

  console.log(`With website URL: ${withWebsite} / ${pool.length}`)
  console.log(`Saved to: enriched-foundations-ntee.json`)
}

main().catch(console.error)
