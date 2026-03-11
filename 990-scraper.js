const https = require('https')
const fs = require('fs')

const STATES = process.argv.slice(2).length > 0
  ? process.argv.slice(2).map(s => s.toUpperCase())
  : ['TX','CA','NY','FL','IL','PA','OH','GA','WA','NC','MI','NJ','VA','AZ','MA','TN','IN','MO','MD','WI','CO','MN','SC','AL','LA','KY','OR','OK','CT','IA','AR','MS','KS','NV','NM','NE','WV','ID','HI','NH','ME','MT','RI','DE','SD','ND','AK','VT','WY']

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e) { resolve(null) } })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); resolve(null) })
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function scrapeState(state) {
  const found = []
  const seen = new Set()
  const queries = ['community+foundation', 'scholarship+fund', 'educational+foundation']
  
  for (const q of queries) {
    for (let page = 0; page <= 2; page++) {
      const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${q}&state%5Bid%5D=${state}&page=${page}`
      const data = await get(url)
      if (!data?.organizations?.length) break
      
      for (const org of data.organizations) {
        if (!org.ein || seen.has(org.ein)) continue
        const name = (org.name || '').toLowerCase()
        if (!name.includes('foundation') && !name.includes('scholarship') && !name.includes('trust') && !name.includes('fund')) continue
        seen.add(org.ein)
        found.push({
          id: `pp-${org.ein}`,
          name: org.name,
          state,
          city: org.city || '',
          county: org.city || '',
          amount: '$500-$5,000',
          deadline: 'Varies',
          eligibility: `${org.city || state} area residents - verify eligibility at foundation website`,
          url: `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
          propublica_url: `https://projects.propublica.org/nonprofits/organizations/${org.ein}`,
          tags: ['community','local','need-based'],
          ein: org.ein,
          revenue: org.revenue_amount || 0,
        })
      }
      await sleep(200)
    }
    await sleep(300)
  }
  return found
}

async function main() {
  const all = []
  for (const state of STATES) {
    process.stdout.write(`[${state}] `)
    try {
      const found = await scrapeState(state)
      console.log(`${found.length}`)
      all.push(...found)
    } catch(e) { console.log(`err: ${e.message}`) }
    await sleep(500)
  }
  
  const deduped = Object.values(Object.fromEntries(all.map(f => [f.ein, f])))
  deduped.sort((a,b) => b.revenue - a.revenue)
  
  fs.writeFileSync('scraped-foundations.json', JSON.stringify({ total: deduped.length, foundations: deduped }, null, 2))
  console.log(`\nTotal: ${deduped.length} unique foundations saved to scraped-foundations.json`)
}

main().catch(console.error)
