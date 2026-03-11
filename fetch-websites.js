const https = require('https')
const fs = require('fs')

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e) { resolve(null) } })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(8000, () => { req.destroy(); resolve(null) })
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const data = JSON.parse(fs.readFileSync('scraped-foundations.json'))
  const foundations = data.foundations
  console.log('Fetching websites for', foundations.length, 'foundations...')
  
  let found = 0
  for (let i = 0; i < foundations.length; i++) {
    const f = foundations[i]
    const ein = f.ein
    if (!ein) continue
    
    const org = await get('https://projects.propublica.org/nonprofits/api/v2/organizations/' + ein + '.json')
    if (org && org.organization && org.organization.website) {
      foundations[i].website = org.organization.website
      found++
    }
    
    if (i % 50 === 0) process.stdout.write('\n[' + i + '/' + foundations.length + '] found:' + found + ' ')
    else process.stdout.write('.')
    await sleep(150)
  }
  
  fs.writeFileSync('scraped-foundations.json', JSON.stringify({ total: foundations.length, foundations }, null, 2))
  console.log('\n\nDone! Found websites for', found, 'foundations')
}

main().catch(console.error)
