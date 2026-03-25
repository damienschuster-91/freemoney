/**
 * cleanup-dead-urls.js
 * Removes confirmed-dead entries from lib/data.ts:
 *   - All NOT_FOUND (404)
 *   - All CLIENT_ERR_410 (Gone)
 *   - All REDIRECT_LOOP
 */

const fs = require('fs')

const DEAD_URLS = new Set([
  // NOT_FOUND (76)
  'https://www.nhs.us/students/scholarships',
  'https://www.skillsusa.org/scholarships',
  'https://scholarshipamerica.org/dollarforscholars',
  'https://www.discover.com/student-loans/scholarship',
  'https://www.ecampustours.com/scholarship',
  'https://corporate.comcast.com/impact/education',
  'https://www.elsevier.com/about/giving-back',
  'https://www.chick-fil-a.com/stories/community/scholarships',
  'https://equitable.com/foundation/scholarships',
  'https://www.thermofisher.com/us/en/home/life-science/antibodies/antibody-scholarship.html',
  'https://doodles.google/doodle-4-google',
  'https://nppa.org/scholarships',
  'https://www.aicpa.org/career/scholarships',
  'https://www.ametsoc.org/scholarships',
  'https://www.aia.org/scholarships',
  'https://www.shrm.org/foundation/scholarships',
  'https://www.legion.org/baseball/scholarships',
  'https://www.akdn.org/our-agencies/aga-khan-foundation/usa',
  'https://www.nationalmssociety.org/scholarships',
  'https://www.jvs.org/scholarships',
  'https://www.indian-affairs.org/scholarships.html',
  'https://www.afsascholarship.org/essay-contest',
  'https://chci.org/scholarships',
  'https://www.phikappaphi.org/fellowships',
  'https://www.nrca.net/foundation/scholarships',
  'https://www.abc.org/education-training/scholarships',
  'https://www.phcc.org/foundation/scholarships',
  'https://www.daad.de/en/study-research-teach-germany/scholarships',
  'https://bigfuture.collegeboard.org/scholarship',
  'https://afsascholarship.org/open-scholarship',
  'https://www.unigo.com/scholarships/our-scholarships/10k-scholarship',
  'https://primaryimmune.org/scholarships',
  'https://wellsfargo.com/jump/enterprise/disability-scholarship',
  'https://www.coda-international.org/scholarship',
  'https://www.limeconnect.com/programs/page/scholarship-program',
  'https://www.ahima.org/scholarships',
  'https://www.ast.org/foundation',
  'https://www.clevelandfoundation.org/grants/scholarships',
  'https://www.alzfdn.org/resources/teens-for-alzheimers-awareness-college-scholarship-fund',
  'https://houstonendowment.org/scholarships',
  'https://www.calfund.org/scholarships',
  'https://www.cfbroward.org/scholarships',
  'https://www.cct.org/scholarships',
  'https://www.greatermilwaukeefoundation.org/scholarships',
  'https://www.minneapolisfoundation.org/scholarships',
  'https://www.cfmt.org/ways-to-give/scholarships/',
  'https://www.hfpg.org/scholarships',
  'https://www.tbf.org/scholarships',
  'https://vermontcf.org/scholarships',
  'https://www.tgkvf.org/scholarships',
  'https://www.communityfoundationsa.org/scholarships',
  'https://www.cfbham.org/scholarships',
  'https://braf.org/scholarships',
  'https://www.hawaiicommunityfoundation.org/scholarships',
  'https://idahocf.org/scholarships',
  'https://www.gwcf.org/scholarships',
  'https://kansashealth.org/scholarships',
  'https://www.iowawestfoundation.org/scholarships',
  'https://nmcf.org/scholarships',
  'https://www.ndcf.net/scholarships',
  'https://nevadacf.org/scholarships',
  'https://www.cf-lowcountry.org/scholarships',
  'https://www.ebcf.org/scholarships',
  'https://www.rasmuson.org/grants-scholarships',
  'https://www.cftampabay.org/scholarships',
  'https://www.sdfoundation.org/programs/programs-for-individuals/scholarships',
  'https://www.tetonvalleyfoundation.org/scholarships',
  'https://www.spmcf.org/scholarships',
  'https://www.swifoundation.org/scholarships',
  'https://www.cfcga.org/scholarships',
  'https://www.omahafoundation.org/scholarships',
  'https://www.cfwnc.org/scholarships',
  'https://www.youngstownfoundation.org/scholarships',
  'https://www.fmareafoundation.org/scholarships',
  'https://www.innovia.org/scholarships',
  // CLIENT_ERR_410 (1)
  'https://www.talbots.com/scholarship',
  // REDIRECT_LOOP (3)
  'https://www.nationalmerit.org',
  'https://www.zonta.org/WhatWeDo/InternationalPrograms/AmeliaEarhartFellowship',
  'https://pgsf.org',
])

const dataPath = 'lib/data.ts'
const original = fs.readFileSync(dataPath, 'utf8')
const lines    = original.split('\n')

let removed = 0
const kept = lines.filter(line => {
  // Only consider lines that are data entries (start with whitespace + { id:)
  if (!/^\s+\{ id:/.test(line)) return true
  // Check if this line's url field matches a dead URL
  // Match url:" or url: " (with or without space after colon)
  const urlMatch = line.match(/(?<![a-z])url:\s*"([^"]+)"/)
  if (urlMatch && DEAD_URLS.has(urlMatch[1])) {
    removed++
    return false
  }
  return true
})

const updated = kept.join('\n')

// Sanity check
const before = (original.match(/^\s+\{ id:/gm) || []).length
const after  = (updated.match(/^\s+\{ id:/gm) || []).length
console.log(`Entries before: ${before}`)
console.log(`Entries removed: ${removed}`)
console.log(`Entries after:  ${after}`)

if (before - after !== removed) {
  console.error(`ERROR: count mismatch (${before} - ${removed} != ${after})`)
  process.exit(1)
}

// Check any dead URLs not matched (entries already absent or URL mismatch)
const updatedUrls = new Set([...updated.matchAll(/(?<![a-z])url:\s*"([^"]+)"/g)].map(m => m[1]))
const notFound = [...DEAD_URLS].filter(u => !updatedUrls.has(u) && original.includes(u))
if (notFound.length) {
  console.log(`\nNote: ${notFound.length} dead URLs were already absent (or matched propublica_url only)`)
}
const stillPresent = [...DEAD_URLS].filter(u => updatedUrls.has(u))
if (stillPresent.length) {
  console.error(`ERROR: ${stillPresent.length} dead URLs still present after removal:`)
  stillPresent.forEach(u => console.error(' ', u))
  process.exit(1)
}

fs.writeFileSync(dataPath + '.bak', original)
fs.writeFileSync(dataPath, updated)
console.log(`\nDone. lib/data.ts updated (backup -> lib/data.ts.bak)`)
