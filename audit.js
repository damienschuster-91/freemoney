/**
 * audit.js
 * Checks all URLs in lib/data.ts and reports duplicates.
 * Outputs: broken-urls.txt, duplicates.txt
 *
 * Usage: node audit.js
 */

const https = require('https')
const http  = require('http')
const fs    = require('fs')
const { URL } = require('url')

const CONCURRENCY = 8
const TIMEOUT_MS  = 12000
const MAX_HOPS    = 5

// ---------------------------------------------------------------------------
// Parse entries from lib/data.ts source (no eval — regex only)
// ---------------------------------------------------------------------------
function parseEntries(src) {
  const entries = []

  // SCHOLARSHIPS: url has a space after colon
  const schSection = src.slice(
    src.indexOf('const RAW_SCHOLARSHIPS'),
    src.indexOf('export const SCHOLARSHIPS')
  )
  const schEntries = [...schSection.matchAll(
    /\{\s*id:\s*(\d+)[^}]*?name:\s*"([^"]+)"[^}]*?url:\s*"([^"]+)"/gs
  )]
  for (const m of schEntries) {
    entries.push({ type: 'scholarship', id: m[1], name: m[2], url: m[3], ein: null })
  }

  // LOCAL_DATA: url and propublica_url are adjacent — match url:" but NOT propublica_url:"
  const locSection = src.slice(
    src.indexOf('const RAW_LOCAL'),
    src.indexOf('export const LOCAL_DATA')
  )
  // Each row: id, name, state, ..., url:"...", propublica_url:"...", ...
  const locEntries = [...locSection.matchAll(
    /\{ id:"([^"]+)", name:"([^"]+)", state:"([^"]+)"[^}]*?(?<![a-z])url:"([^"]+)"[^}]*?propublica_url:"[^"]*?(?:\/organizations\/(\d+))?[^"]*"/gs
  )]
  for (const m of locEntries) {
    entries.push({ type: 'local', id: m[1], name: m[2], state: m[3], url: m[4], ein: m[5] || null })
  }

  return entries
}

// ---------------------------------------------------------------------------
// HEAD request with redirect following
// ---------------------------------------------------------------------------
function checkUrl(rawUrl) {
  return new Promise(resolve => {
    let hops = 0
    let currentUrl = rawUrl
    const visited = []

    function attempt(url, method = 'HEAD') {
      let parsed
      try { parsed = new URL(url) } catch {
        return resolve({ url: rawUrl, status: 'INVALID', final: url, hops: visited })
      }

      const lib = parsed.protocol === 'https:' ? https : http
      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers: {
          'User-Agent': 'FreeMoney-Auditor/1.0',
          'Accept': 'text/html,application/xhtml+xml,*/*',
        },
        timeout: TIMEOUT_MS,
      }

      const req = lib.request(options, res => {
        const code = res.statusCode
        res.resume() // drain

        if ([301, 302, 303, 307, 308].includes(code)) {
          const loc = res.headers.location
          if (!loc || hops >= MAX_HOPS) {
            return resolve({ url: rawUrl, status: 'REDIRECT_LOOP', code, final: url, hops: visited })
          }
          hops++
          const next = loc.startsWith('http') ? loc : new URL(loc, url).href
          visited.push({ from: url, to: next, code })
          currentUrl = next
          return attempt(next, 'HEAD')
        }

        // Some servers reject HEAD — retry with GET
        if (code === 405 && method === 'HEAD') {
          return attempt(url, 'GET')
        }

        const status = code >= 200 && code < 300 ? 'OK'
          : code === 404 ? 'NOT_FOUND'
          : code >= 400 && code < 500 ? `CLIENT_ERR_${code}`
          : code >= 500 ? `SERVER_ERR_${code}`
          : `STATUS_${code}`

        resolve({ url: rawUrl, status, code, final: url, hops: visited })
      })

      req.on('timeout', () => { req.destroy(); resolve({ url: rawUrl, status: 'TIMEOUT', final: url, hops: visited }) })
      req.on('error', e => resolve({ url: rawUrl, status: 'CONN_ERROR', error: e.message, final: url, hops: visited }))
      req.end()
    }

    attempt(currentUrl)
  })
}

// ---------------------------------------------------------------------------
// Concurrency pool
// ---------------------------------------------------------------------------
async function runPool(tasks, concurrency) {
  const results = []
  const queue = [...tasks]
  let done = 0
  const total = tasks.length

  async function worker() {
    while (queue.length) {
      const task = queue.shift()
      const result = await task()
      results.push(result)
      done++
      const pct = Math.round(done / total * 100)
      process.stdout.write(`\r  ${done}/${total} (${pct}%)  last: ${result.status.padEnd(12)} ${result.url.slice(0,60)}`)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  process.stdout.write('\n')
  return results
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const src     = fs.readFileSync('lib/data.ts', 'utf8')
  const entries = parseEntries(src)

  console.log(`\nParsed ${entries.length} entries`)
  console.log(`  Scholarships: ${entries.filter(e => e.type === 'scholarship').length}`)
  console.log(`  Local:        ${entries.filter(e => e.type === 'local').length}`)
  console.log(`\nChecking ${entries.length} URLs with concurrency ${CONCURRENCY}...\n`)

  // Deduplicate URLs so we don't double-request same URL
  const urlToEntries = {}
  for (const e of entries) {
    if (!urlToEntries[e.url]) urlToEntries[e.url] = []
    urlToEntries[e.url].push(e)
  }
  const uniqueUrls = Object.keys(urlToEntries)
  console.log(`  (${uniqueUrls.length} unique URLs after dedup)\n`)

  const tasks = uniqueUrls.map(url => () => checkUrl(url))
  const results = await runPool(tasks, CONCURRENCY)

  // Map results back to entries
  const resultByUrl = {}
  for (const r of results) resultByUrl[r.url] = r

  // ---------------------------------------------------------------------------
  // Build broken-urls.txt
  // ---------------------------------------------------------------------------
  const broken   = results.filter(r => r.status !== 'OK')
  const ok       = results.filter(r => r.status === 'OK')
  const redirects = results.filter(r => r.hops && r.hops.length > 0 && r.status === 'OK')

  let brokenReport = `URL AUDIT REPORT — ${new Date().toISOString()}\n`
  brokenReport += `${'='.repeat(70)}\n\n`
  brokenReport += `SUMMARY\n`
  brokenReport += `  Total URLs checked:  ${uniqueUrls.length}\n`
  brokenReport += `  OK (2xx):            ${ok.length}\n`
  brokenReport += `  OK via redirect:     ${redirects.length}\n`
  brokenReport += `  Broken:              ${broken.length}\n\n`

  const groups = {}
  for (const r of broken) {
    if (!groups[r.status]) groups[r.status] = []
    groups[r.status].push(r)
  }

  for (const [status, items] of Object.entries(groups).sort()) {
    brokenReport += `${status} (${items.length})\n${'─'.repeat(50)}\n`
    for (const r of items) {
      const affected = urlToEntries[r.url] || []
      for (const e of affected) {
        const label = e.type === 'local' ? `[LOCAL/${e.state}] ${e.name}` : `[SCH] ${e.name}`
        brokenReport += `  ${label}\n`
        brokenReport += `  URL: ${r.url}\n`
        if (r.error)       brokenReport += `  Error: ${r.error}\n`
        if (r.hops?.length) brokenReport += `  Hops: ${r.hops.map(h => `${h.code} -> ${h.to}`).join(' | ')}\n`
        brokenReport += '\n'
      }
    }
  }

  if (redirects.length) {
    brokenReport += `\nREDIRECTS (OK but URL has moved)\n${'─'.repeat(50)}\n`
    for (const r of redirects) {
      const affected = urlToEntries[r.url] || []
      for (const e of affected) {
        const label = e.type === 'local' ? `[LOCAL/${e.state}] ${e.name}` : `[SCH] ${e.name}`
        brokenReport += `  ${label}\n`
        brokenReport += `  From: ${r.url}\n`
        brokenReport += `  To:   ${r.final}\n\n`
      }
    }
  }

  fs.writeFileSync('broken-urls.txt', brokenReport)

  // ---------------------------------------------------------------------------
  // Build duplicates.txt
  // ---------------------------------------------------------------------------
  let dupReport = `DUPLICATES REPORT — ${new Date().toISOString()}\n`
  dupReport += `${'='.repeat(70)}\n\n`

  // Duplicate names (case-insensitive, across all entries)
  const nameMap = {}
  for (const e of entries) {
    const key = e.name.toLowerCase().trim()
    if (!nameMap[key]) nameMap[key] = []
    nameMap[key].push(e)
  }
  const dupNames = Object.entries(nameMap).filter(([, v]) => v.length > 1)

  dupReport += `DUPLICATE NAMES (${dupNames.length})\n${'─'.repeat(50)}\n`
  if (!dupNames.length) {
    dupReport += '  None found.\n\n'
  } else {
    for (const [name, items] of dupNames.sort()) {
      dupReport += `  "${items[0].name}"\n`
      for (const e of items) {
        const loc = e.type === 'local' ? ` [${e.state}]` : ''
        dupReport += `    ${e.type}${loc} — id: ${e.id} — ${e.url}\n`
      }
      dupReport += '\n'
    }
  }

  // Duplicate EINs (local only, where ein is populated)
  const einMap = {}
  for (const e of entries.filter(e => e.ein)) {
    if (!einMap[e.ein]) einMap[e.ein] = []
    einMap[e.ein].push(e)
  }
  const dupEins = Object.entries(einMap).filter(([, v]) => v.length > 1)

  dupReport += `\nDUPLICATE EINs (${dupEins.length})\n${'─'.repeat(50)}\n`
  if (!dupEins.length) {
    dupReport += '  None found.\n\n'
  } else {
    for (const [ein, items] of dupEins.sort()) {
      dupReport += `  EIN: ${ein}\n`
      for (const e of items) {
        dupReport += `    [${e.state}] ${e.name} — id: ${e.id}\n`
      }
      dupReport += '\n'
    }
  }

  fs.writeFileSync('duplicates.txt', dupReport)

  // ---------------------------------------------------------------------------
  // Console summary
  // ---------------------------------------------------------------------------
  console.log(`\nURL CHECK RESULTS`)
  console.log(`  OK:          ${ok.length}`)
  console.log(`  Redirects:   ${redirects.length}`)
  console.log(`  Broken:      ${broken.length}`)
  for (const [s, items] of Object.entries(groups).sort()) {
    console.log(`    ${s}: ${items.length}`)
  }
  console.log(`\nDUPLICATES`)
  console.log(`  Duplicate names: ${dupNames.length}`)
  console.log(`  Duplicate EINs:  ${dupEins.length}`)
  console.log(`\nReports written to:`)
  console.log(`  broken-urls.txt`)
  console.log(`  duplicates.txt`)
}

main().catch(console.error)
