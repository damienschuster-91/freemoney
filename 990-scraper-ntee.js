/**
 * 990-scraper-ntee.js
 * Pulls scholarship foundations from THREE data sources:
 *
 *   Pass 1 — ProPublica 990 public charities (NTEE B82 + keyword search)
 *   Pass 2 — ProPublica 990-PF private foundations ("scholarship" + NTEE B82/T20)
 *   Pass 3 — IRS TEOS (Tax Exempt Org Search) for 990-EZ / 990-N filers
 *
 * Output format matches the CMS import shape:
 *   { meta: { ... }, total, listings: Foundation[] }
 *
 * Usage:
 *   node 990-scraper-ntee.js                  # all 50 states
 *   node 990-scraper-ntee.js TX CA FL NY IL   # specific states
 *   node 990-scraper-ntee.js --dry-run        # show new-EIN count, don't write
 *   node 990-scraper-ntee.js --dry-run TX CA  # dry-run for specific states
 */

const https = require('https')
const http  = require('http')
const fs    = require('fs')
const path  = require('path')
// CSV parsing done manually below to avoid external dependency

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const rawArgs  = process.argv.slice(2)
const DRY_RUN  = rawArgs.includes('--dry-run')
const stateArgs = rawArgs.filter(a => !a.startsWith('--'))

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ALL_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const STATES = stateArgs.length
  ? stateArgs.map(s => s.toUpperCase())
  : ALL_STATES

const NTEE_CODES  = ['B82', 'T20']           // Scholarships + Private Grantmaking
const OUTPUT_FILE = 'scraped-foundations-ntee.json'
const DELAY_MS    = 250                        // between API calls — be a good citizen

// Existing-data files for deduplication
const EXISTING_FILES = [
  'scraped-foundations.json',
  'scraped-foundations-ntee.json',
]
const EXISTING_CSV     = 'research-queue.csv'
const EXISTING_DATA_TS = path.join(__dirname, 'lib', 'data.ts')

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function httpGet(url, timeoutMs = 15000) {
  const lib = url.startsWith('https') ? https : http
  return new Promise((resolve) => {
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'FreeMoney Scholarship Research Bot/1.0',
        'Accept': 'application/json',
      },
    }, res => {
      // Follow redirects (3xx)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpGet(res.headers.location, timeoutMs))
      }
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(body)) }
        catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve(null) })
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ---------------------------------------------------------------------------
// Load existing EINs for dedup
// ---------------------------------------------------------------------------
function loadExistingEINs() {
  const eins = new Set()

  // JSON listing files
  for (const file of EXISTING_FILES) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'))
      for (const item of data.listings || []) {
        const ein = String(item.ein || '').replace(/\D/g, '')
        if (ein) eins.add(ein)
      }
    } catch { /* file may not exist yet */ }
  }

  // CSV (manual parse to avoid dependency)
  try {
    const raw = fs.readFileSync(EXISTING_CSV, 'utf8')
    const lines = raw.split('\n')
    for (let i = 1; i < lines.length; i++) {
      // EIN is the first column; strip quotes
      const ein = (lines[i].split(',')[0] || '').replace(/["'\s]/g, '')
      if (ein && /^\d+$/.test(ein)) eins.add(ein)
    }
  } catch { /* file may not exist */ }

  // lib/data.ts — EINs already live on the site
  try {
    const src = fs.readFileSync(EXISTING_DATA_TS, 'utf8')
    // Match ein:"123..." or ein: "123..."
    for (const m of src.matchAll(/\bein\s*:\s*["'](\d+)["']/g)) eins.add(m[1])
    // Also catch any propublica_url EINs: /organizations/123456789
    for (const m of src.matchAll(/\/organizations\/(\d{6,})/g)) eins.add(m[1])
  } catch { /* lib/data.ts not readable */ }

  return eins
}

// ---------------------------------------------------------------------------
// Slug helper (matches CMS slug convention)
// ---------------------------------------------------------------------------
function makeSlug(state, ein, name) {
  const namePart = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${state.toLowerCase()}-${ein}-${namePart}`.slice(0, 120)
}

// ---------------------------------------------------------------------------
// Map a ProPublica org record → CMS Foundation shape
// ---------------------------------------------------------------------------
function toFoundation(org, state, source = 'propublica-990') {
  const ein = String(org.ein || '').replace(/\D/g, '')
  if (!ein) return null

  const name = (org.name || '').trim()
  const city = (org.city || '').trim()

  return {
    id:             `pp-${ein}`,
    ein,
    name,
    state,
    city,
    county:         city,
    amount:         '$500–$5,000',
    deadline:       'Varies',
    eligibility:    city
      ? `${city}, ${state} area residents — verify current eligibility at foundation website`
      : `${state} residents — verify current eligibility at foundation website`,
    url:            `https://projects.propublica.org/nonprofits/organizations/${ein}`,
    propublica_url: `https://projects.propublica.org/nonprofits/organizations/${ein}`,
    ntee_code:      org.ntee_code || 'B82',
    revenue_raw:    org.revenue_amount || 0,
    latest_year:    org.tax_prd ? Math.floor(org.tax_prd / 100) : null,
    tags:           source === 'propublica-pf'
      ? ['private-foundation', 'scholarship', 'grant']
      : ['community', 'local', 'need-based'],
    source,
    slug:           makeSlug(state, ein, name),
  }
}

// ---------------------------------------------------------------------------
// Map an IRS TEOS hit → CMS Foundation shape
// ---------------------------------------------------------------------------
function teosToFoundation(hit) {
  const src = hit._source || hit
  const ein = String(src.ein || '').replace(/\D/g, '')
  if (!ein) return null

  const name  = (src.sort_name || src.name || '').trim()
  const state = (src.state || '').trim().toUpperCase()
  const city  = (src.city || '').trim()

  if (!state || !name) return null

  return {
    id:             `teos-${ein}`,
    ein,
    name,
    state,
    city,
    county:         city,
    amount:         'Varies',
    deadline:       'Varies',
    eligibility:    city
      ? `${city}, ${state} area residents — verify current eligibility`
      : `${state} residents — verify current eligibility`,
    url:            `https://apps.irs.gov/app/eos/detailsPage?ein=${ein}&name=${encodeURIComponent(name)}&city=${encodeURIComponent(city)}&state=${state}&countryAbbr=US&type=determLetterOnly`,
    propublica_url: `https://projects.propublica.org/nonprofits/organizations/${ein}`,
    ntee_code:      src.ntee_cd || '',
    revenue_raw:    0,
    latest_year:    null,
    tags:           ['irs-teos', 'small-filer', 'scholarship'],
    source:         'irs-teos',
    slug:           makeSlug(state, ein, name),
  }
}

// ---------------------------------------------------------------------------
// ProPublica: fetch one page
// ---------------------------------------------------------------------------
async function ppFetchPage(state, params, page) {
  const qs = Object.entries({ ...params, page, 'state%5Bid%5D': state })
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  const url = `https://projects.propublica.org/nonprofits/api/v2/search.json?${qs}`
  return httpGet(url)
}

// ---------------------------------------------------------------------------
// PASS 1 — ProPublica 990 public charities (existing logic)
// ---------------------------------------------------------------------------
async function scrapePublicCharities(state, seen, found) {
  function addOrg(org) {
    const f = toFoundation(org, state, 'propublica-990')
    if (!f || seen.has(f.ein)) return
    seen.add(f.ein)
    found.push(f)
  }

  // NTEE B82 (up to 10 pages = ~250 results)
  for (let page = 0; page <= 9; page++) {
    const data = await ppFetchPage(state, { 'ntee%5Bid%5D': 'B82' }, page)
    const orgs = data?.organizations ?? []
    if (!orgs.length) break
    orgs.forEach(addOrg)
    await sleep(DELAY_MS)
  }

  // Keyword queries for community foundations not tagged B82
  const keywords = ['community+foundation', 'scholarship+fund', 'educational+foundation']
  for (const q of keywords) {
    for (let page = 0; page <= 2; page++) {
      const data = await ppFetchPage(state, { q }, page)
      const orgs = data?.organizations ?? []
      if (!orgs.length) break

      for (const org of orgs) {
        const name = (org.name || '').toLowerCase()
        if (
          name.includes('foundation') ||
          name.includes('scholarship') ||
          name.includes('trust') ||
          name.includes('fund') ||
          name.includes('endowment')
        ) {
          addOrg(org)
        }
      }
      await sleep(DELAY_MS)
    }
    await sleep(200)
  }
}

// ---------------------------------------------------------------------------
// PASS 2 — ProPublica 990-PF private foundations
// ---------------------------------------------------------------------------
async function scrapePrivateFoundations(state, seen, found) {
  function addOrg(org) {
    const f = toFoundation(org, state, 'propublica-pf')
    if (!f || seen.has(f.ein)) return
    seen.add(f.ein)
    found.push(f)
  }

  // 2a — "scholarship" keyword with filing_type=PF (user-specified)
  //       Also try c_code[id]=3 (501c3) as a fallback since ProPublica may
  //       not support filing_type natively on all endpoints.
  const pfKeywords = ['scholarship', 'scholarship+fund', 'educational+scholarship']
  for (const q of pfKeywords) {
    // Try filing_type=PF first (ProPublica param for 990-PF filers)
    for (let page = 0; page <= 4; page++) {
      const data = await ppFetchPage(state, { q, filing_type: 'PF' }, page)
      const orgs = data?.organizations ?? []
      if (!orgs.length) break
      for (const org of orgs) {
        const name = (org.name || '').toLowerCase()
        if (
          name.includes('scholarship') || name.includes('foundation') ||
          name.includes('trust')       || name.includes('fund') ||
          name.includes('grant')       || name.includes('endowment')
        ) addOrg(org)
      }
      await sleep(DELAY_MS)
    }
    // Also hit c_code[id]=3 (catches PFs tagged as 501c3 without filing_type)
    for (let page = 0; page <= 2; page++) {
      const data = await ppFetchPage(state, { q, 'c_code%5Bid%5D': '3' }, page)
      const orgs = data?.organizations ?? []
      if (!orgs.length) break
      for (const org of orgs) {
        const name = (org.name || '').toLowerCase()
        if (
          name.includes('scholarship') || name.includes('foundation') ||
          name.includes('trust')       || name.includes('fund') ||
          name.includes('grant')       || name.includes('endowment')
        ) addOrg(org)
      }
      await sleep(DELAY_MS)
    }
    await sleep(200)
  }

  // 2b — NTEE B82 with filing_type=PF
  for (let page = 0; page <= 4; page++) {
    const data = await ppFetchPage(state, { 'ntee%5Bid%5D': 'B82', filing_type: 'PF' }, page)
    const orgs = data?.organizations ?? []
    if (!orgs.length) break
    orgs.forEach(addOrg)
    await sleep(DELAY_MS)
  }

  // 2c — NTEE T20 (Private Grantmaking Foundations) with filing_type=PF
  for (let page = 0; page <= 4; page++) {
    const data = await ppFetchPage(state, { 'ntee%5Bid%5D': 'T20', filing_type: 'PF' }, page)
    const orgs = data?.organizations ?? []
    if (!orgs.length) break
    orgs.forEach(o => {
      const name = (o.name || '').toLowerCase()
      if (name.includes('scholarship') || name.includes('education') ||
          name.includes('fund')        || name.includes('foundation')) addOrg(o)
    })
    await sleep(DELAY_MS)
  }
}

// ---------------------------------------------------------------------------
// PASS 3 — IRS TEOS (Tax Exempt Organization Search)
//
// Two sub-strategies:
//   3a — Hit the IRS TEOS internal Elasticsearch endpoint that the web UI uses
//         (https://apps.irs.gov/app/eos/allSearch … resultType=json)
//         This catches 990-EZ and 990-N filers ProPublica often misses.
//   3b — Fallback: hit the IRS EO BMF (Exempt Org Business Master File) search
//         endpoint which returns JSON for known orgs.
//
// Both endpoints are undocumented but stable; the web UI at
// https://apps.irs.gov/app/eos/ calls them on every search.
// ---------------------------------------------------------------------------
async function scrapeTEOS(state, seen, found) {
  const keywords = ['scholarship', 'scholarship fund', 'educational scholarship']

  for (const kw of keywords) {
    // 3a — TEOS allSearch endpoint (mirrors what the web UI calls)
    const encodedName = encodeURIComponent(kw)
    const teosUrl = `https://apps.irs.gov/app/eos/allSearch?names=${encodedName}&state=${state}&country=US&deductibility=all&dispatchMethod=searchAll&searchChoice=name&isDescending=false&resultsPerPage=100&resultType=json`

    let data = await httpGet(teosUrl, 20000)

    // 3b — Fallback: try the efts (ElasticFull-Text Search) endpoint
    if (!data) {
      const eftsUrl = `https://efts.irs.gov/LATEST/search-index?q=${encodedName}&state=${state}&size=100`
      data = await httpGet(eftsUrl, 20000)
    }

    if (!data) continue

    // TEOS response shapes vary — normalize
    const orgs = data.organizations          // allSearch shape
      || data.hits?.hits                     // efts shape
      || data.records                        // alt shape
      || (Array.isArray(data) ? data : [])

    for (const raw of orgs) {
      const f = teosToFoundation(raw)
      if (!f || seen.has(f.ein)) continue
      if (f.state !== state) continue

      const name = f.name.toLowerCase()
      if (
        name.includes('scholarship') ||
        name.includes('educational') ||
        name.includes('student aid') ||
        name.includes('tuition')
      ) {
        seen.add(f.ein)
        found.push(f)
      }
    }
    await sleep(DELAY_MS)
  }
}

// ---------------------------------------------------------------------------
// Scrape one state — all three passes
// ---------------------------------------------------------------------------
async function scrapeState(state) {
  const seen  = new Set()
  const found = []

  const counts = { pass1: 0, pass2: 0, pass3: 0 }

  // Pass 1: Public charities
  await scrapePublicCharities(state, seen, found)
  counts.pass1 = found.length

  // Pass 2: Private foundations
  const beforePF = found.length
  await scrapePrivateFoundations(state, seen, found)
  counts.pass2 = found.length - beforePF

  // Pass 3: IRS TEOS
  const beforeTEOS = found.length
  await scrapeTEOS(state, seen, found)
  counts.pass3 = found.length - beforeTEOS

  return { found, counts }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n990 Multi-Source Scraper v2.0`)
  console.log(`  Pass 1: ProPublica 990 (NTEE B82 + keywords)`)
  console.log(`  Pass 2: ProPublica 990-PF (private foundations + scholarship + B82/T20)`)
  console.log(`  Pass 3: IRS TEOS (990-EZ / 990-N filers)`)
  console.log(`  States: ${STATES.join(', ')}`)
  if (DRY_RUN) console.log(`  Mode:   DRY RUN — will not write output file`)
  console.log()

  // Load existing EINs for dedup report
  const existingEINs = loadExistingEINs()
  console.log(`Loaded ${existingEINs.size} existing EINs from prior scrapes + CSV\n`)

  const allByEin = new Map()
  const stateCounts = {}
  const totals = { pass1: 0, pass2: 0, pass3: 0 }

  for (const state of STATES) {
    process.stdout.write(`[${state}] `)
    try {
      const { found, counts } = await scrapeState(state)
      stateCounts[state] = { total: found.length, ...counts }
      totals.pass1 += counts.pass1
      totals.pass2 += counts.pass2
      totals.pass3 += counts.pass3

      const pfTag = counts.pass2 > 0 ? ` (+${counts.pass2} PF)` : ''
      const teosTag = counts.pass3 > 0 ? ` (+${counts.pass3} TEOS)` : ''
      console.log(`${found.length}${pfTag}${teosTag}`)

      for (const f of found) {
        if (!allByEin.has(f.ein) || f.revenue_raw > (allByEin.get(f.ein).revenue_raw || 0)) {
          allByEin.set(f.ein, f)
        }
      }
    } catch (e) {
      stateCounts[state] = { total: 0, pass1: 0, pass2: 0, pass3: 0 }
      console.log(`err: ${e.message}`)
    }
    await sleep(400)
  }

  // Sort by revenue desc
  const listings = [...allByEin.values()].sort((a, b) => (b.revenue_raw || 0) - (a.revenue_raw || 0))

  // Dedup report
  let newEINs = 0
  let existingHits = 0
  const newBySource = { 'propublica-990': 0, 'propublica-pf': 0, 'irs-teos': 0 }

  for (const f of listings) {
    if (existingEINs.has(f.ein)) {
      existingHits++
    } else {
      newEINs++
      newBySource[f.source] = (newBySource[f.source] || 0) + 1
    }
  }

  console.log('\n===== RESULTS =====')
  console.log(`\nTotal scraped (all sources):  ${listings.length}`)
  console.log(`  Pass 1 — ProPublica 990:     ${totals.pass1}`)
  console.log(`  Pass 2 — ProPublica 990-PF:  ${totals.pass2}`)
  console.log(`  Pass 3 — IRS TEOS:           ${totals.pass3}`)
  console.log(`\nAlready in existing data:     ${existingHits}`)
  console.log(`NEW unique EINs:             ${newEINs}`)
  console.log(`  from 990-PF pass:           ${newBySource['propublica-pf']}`)
  console.log(`  from TEOS pass:             ${newBySource['irs-teos']}`)
  console.log(`  from 990 pass (new):        ${newBySource['propublica-990']}`)

  console.log('\n--- Per-state breakdown ---')
  for (const [s, c] of Object.entries(stateCounts)) {
    const pfNote = c.pass2 > 0 ? ` (PF:${c.pass2})` : ''
    const teosNote = c.pass3 > 0 ? ` (TEOS:${c.pass3})` : ''
    console.log(`  ${s}: ${c.total}${pfNote}${teosNote}`)
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would write ${listings.length} listings to ${OUTPUT_FILE}`)
    console.log(`[DRY RUN] ${newEINs} of those are NEW (not in existing data)`)
    console.log(`[DRY RUN] Re-run without --dry-run to write the file.`)
    return
  }

  const output = {
    meta: {
      scraped_at:     new Date().toISOString(),
      version:        '2.0',
      sources:        ['propublica-990', 'propublica-pf', 'irs-teos'],
      ntee_codes:     NTEE_CODES,
      states_scraped: STATES,
      state_counts:   stateCounts,
      dedup: {
        existing_eins:  existingEINs.size,
        new_eins:       newEINs,
        overlap:        existingHits,
        new_by_source:  newBySource,
      },
    },
    total:    listings.length,
    listings,
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2))

  console.log(`\nSaved ${listings.length} listings to ${OUTPUT_FILE}`)
  console.log(`Paste the contents of ${OUTPUT_FILE} into the CMS import box.`)
}

main().catch(console.error)
