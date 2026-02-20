/**
 * scraper.ts
 *
 * Downloads Cambridge IGCSE grade threshold PDFs for all supported subjects.
 *
 * FM (Feb/March): hardcoded URLs → scripts/raw/{year}/{code}.pdf
 * MJ (May/June):  dynamic discovery → scripts/raw/mj/{year}/{code}.pdf
 * ON (Oct/Nov):   dynamic discovery → scripts/raw/on/{year}/{code}.pdf
 *
 * Run with: pnpm pipeline:scrape
 * Files are skipped if already present.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RAW_DIR = join(__dirname, 'raw')
const BASE_URL = 'https://www.cambridgeinternational.org'

const SUPPORTED_CODES = new Set([
  '0417', '0450', '0452', '0455', '0460', '0470', '0475', '0478',
  '0495', '0500', '0520', '0549', '0580', '0606', '0610', '0620', '0625', '0653',
])

const MJ_YEARS = ['2021', '2022', '2023', '2024', '2025']
const ON_YEARS = ['2021', '2022', '2023', '2024', '2025']

const SEASON_PAGES: Record<string, Record<string, string>> = {
  mj: Object.fromEntries(MJ_YEARS.map(y => [y,
    `${BASE_URL}/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/grade-threshold-tables/june-${y}/`
  ])),
  on: Object.fromEntries(ON_YEARS.map(y => [y,
    `${BASE_URL}/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/grade-threshold-tables/november-${y}/`
  ])),
}

// All available Cambridge IGCSE March series grade threshold PDFs
// organised as { year: { syllabusCode: url } }
const THRESHOLD_URLS: Record<string, Record<string, string>> = {
  '2022': {
    '0450': 'https://www.cambridgeinternational.org/Images/654011-business-studies-0450-grade-thresholds-march-2022.pdf',
    '0452': 'https://www.cambridgeinternational.org/Images/654019-accounting-0452-grade-thresholds-march-2022.pdf',
    '0455': 'https://www.cambridgeinternational.org/Images/654020--economics-0455-grade-thresholds-march-2022.pdf',
    '0460': 'https://www.cambridgeinternational.org/Images/654022-geography-0460-grade-thresholds-march-2022.pdf',
    '0470': 'https://www.cambridgeinternational.org/Images/654084-history-0470-grade-thresholds-march-2022.pdf',
    '0478': 'https://www.cambridgeinternational.org/Images/654086-computer-science-0478-grade-thresholds-march-2022.pdf',
    '0500': 'https://www.cambridgeinternational.org/Images/654087-first-language-english-oral-endorsement-0500-grade-thresholds-march-2022.pdf',
    '0520': 'https://www.cambridgeinternational.org/Images/654089-french-foreign-language-0520-grade-thresholds-march-2022.pdf',
    '0580': 'https://www.cambridgeinternational.org/Images/654092-mathematics-without-coursework-0580-grade-thresholds-march-2022.pdf',
    '0606': 'https://www.cambridgeinternational.org/Images/654093-additional-mathematics-0606-grade-thresholds-march-2022.pdf',
    '0610': 'https://www.cambridgeinternational.org/Images/654095-biology-0610-grade-thresholds-march-2022.pdf',
    '0620': 'https://www.cambridgeinternational.org/Images/654096-chemistry-0620-grade-thresholds-march-2022.pdf',
    '0625': 'https://www.cambridgeinternational.org/Images/654097-physics-0625-grade-thresholds-march-2022.pdf',
  },
  '2023': {
    '0450': 'https://www.cambridgeinternational.org/Images/683942-business-studies-0450-march-2023-grade-threshold-table.pdf',
    '0452': 'https://www.cambridgeinternational.org/Images/683934-accounting-0452-march-2023-grade-threshold-table.pdf',
    '0455': 'https://www.cambridgeinternational.org/Images/683947-cambridge-igcse-economics-0455-march-2023-grade-threshold-table.pdf',
    '0460': 'https://www.cambridgeinternational.org/Images/683957-geography-0460-march-2023-grade-threshold-table.pdf',
    '0470': 'https://www.cambridgeinternational.org/Images/683962-history-0470-march-2023-grade-threshold-table.pdf',
    '0475': 'https://www.cambridgeinternational.org/Images/683968-literature-in-english-0475-march-2023-grade-threshold-table.pdf',
    '0478': 'https://www.cambridgeinternational.org/Images/683944-computer-science-0478-march-2023-grade-threshold-table.pdf',
    '0500': 'https://www.cambridgeinternational.org/Images/683948-english-first-language-oral-endorsement-0500-march-2023-grade-threshold-table.pdf',
    '0520': 'https://www.cambridgeinternational.org/Images/683955-french-foreign-language-0520-march-2023-grade-threshold-table.pdf',
    '0549': 'https://www.cambridgeinternational.org/Images/683961-hindi-as-a-second-language-0549-march-2023-grade-threshold-table.pdf',
    '0580': 'https://www.cambridgeinternational.org/Images/683969-mathematics-without-coursework-0580-march-2023-grade-threshold-table.pdf',
    '0606': 'https://www.cambridgeinternational.org/Images/683935-additional-mathematics-0606-march-2023-grade-threshold-table.pdf',
    '0610': 'https://www.cambridgeinternational.org/Images/683941-biology-0610-march-2023-grade-threshold-table.pdf',
    '0620': 'https://www.cambridgeinternational.org/Images/683943-chemistry-0620-march-2023-grade-threshold-table.pdf',
    '0625': 'https://www.cambridgeinternational.org/Images/683974-physics-0625-march-2023-grade-threshold-table.pdf',
    '0653': 'https://www.cambridgeinternational.org/Images/683976-science-combined-0653-march-2023-grade-threshold-table.pdf',
  },
  '2024': {
    '0450': 'https://www.cambridgeinternational.org/Images/711743-business-studies-0450-march-2024-grade-threshold-table.pdf',
    '0452': 'https://www.cambridgeinternational.org/Images/711739-accounting-0452-march-2024-grade-threshold-table.pdf',
    '0455': 'https://www.cambridgeinternational.org/Images/711747-cambridge-igcse-economics-0455-march-2024-grade-threshold-table.pdf',
    '0460': 'https://www.cambridgeinternational.org/Images/711753-geography-0460-march-2024-grade-threshold-table.pdf',
    '0470': 'https://www.cambridgeinternational.org/Images/711756-history-0470-march-2024-grade-threshold-table.pdf',
    '0475': 'https://www.cambridgeinternational.org/Images/711749-literature-in-english-0475-march-2024-grade-threshold-table.pdf',
    '0478': 'https://www.cambridgeinternational.org/Images/711746-computer-science-0478-march-2024-grade-threshold-table.pdf',
    '0500': 'https://www.cambridgeinternational.org/Images/711748-english-first-language-oral-endorsement-0500-march-2024-grade-threshold-table.pdf',
    '0520': 'https://www.cambridgeinternational.org/Images/711752-french-foreign-language-0520-march-2024-grade-threshold-table.pdf',
    '0549': 'https://www.cambridgeinternational.org/Images/711755-hindi-as-a-second-language-0549-march-2024-grade-threshold-table.pdf',
    '0580': 'https://www.cambridgeinternational.org/Images/711758-mathematics-without-coursework-0580-march-2024-grade-threshold-table.pdf',
    '0606': 'https://www.cambridgeinternational.org/Images/711740-additional-mathematics-0606-march-2024-grade-threshold-table.pdf',
    '0610': 'https://www.cambridgeinternational.org/Images/711742-biology-0610-march-2024-grade-threshold-table.pdf',
    '0620': 'https://www.cambridgeinternational.org/Images/711745-chemistry-0620-march-2024-grade-threshold-table.pdf',
    '0625': 'https://www.cambridgeinternational.org/Images/711759-physics-0625-march-2024-grade-threshold-table.pdf',
    '0653': 'https://www.cambridgeinternational.org/Images/711760-science-combined-0653-march-2024-grade-threshold-table.pdf',
  },
  '2025': {
    '0450': 'https://www.cambridgeinternational.org/Images/734990-business-studies-0450-march-2025-grade-threshold-table.pdf',
    '0452': 'https://www.cambridgeinternational.org/Images/734991-accounting-0452-march-2025-grade-threshold-table.pdf',
    '0455': 'https://www.cambridgeinternational.org/Images/734992-cambridge-igcse-economics-0455-march-2025-grade-threshold-table.pdf',
    '0460': 'https://www.cambridgeinternational.org/Images/734994-geography-0460-march-2025-grade-threshold-table.pdf',
    '0470': 'https://www.cambridgeinternational.org/Images/734995-history-0470-march-2025-grade-threshold-table.pdf',
    '0475': 'https://www.cambridgeinternational.org/Images/734996-literature-in-english-0475-march-2025-grade-threshold-table.pdf',
    '0478': 'https://www.cambridgeinternational.org/Images/734997-computer-science-0478-march-2025-grade-threshold-table.pdf',
    '0500': 'https://www.cambridgeinternational.org/Images/734998-english-first-language-oral-endorsement-0500-march-2025-grade-threshold-table.pdf',
    '0520': 'https://www.cambridgeinternational.org/Images/735000-french-foreign-language-0520-march-2025-grade-threshold-table.pdf',
    '0549': 'https://www.cambridgeinternational.org/Images/735002-hindi-as-a-second-language-0549-march-2025-grade-threshold-table.pdf',
    '0580': 'https://www.cambridgeinternational.org/Images/735003-mathematics-without-coursework-0580-march-2025-grade-threshold-table.pdf',
    '0606': 'https://www.cambridgeinternational.org/Images/735004-additional-mathematics-0606-march-2025-grade-threshold-table.pdf',
    '0610': 'https://www.cambridgeinternational.org/Images/735006-biology-0610-march-2025-grade-threshold-table.pdf',
    '0620': 'https://www.cambridgeinternational.org/Images/735007-chemistry-0620-march-2025-grade-threshold-table.pdf',
    '0625': 'https://www.cambridgeinternational.org/Images/735008-physics-0625-march-2025-grade-threshold-table.pdf',
    '0653': 'https://www.cambridgeinternational.org/Images/735009-science-combined-0653-march-2025-grade-threshold-table.pdf',
  },
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
}

/** Fetch a Cambridge threshold tables page and return { code → pdfUrl } for our subjects */
async function discoverPdfUrls(pageUrl: string): Promise<Record<string, string>> {
  const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const result: Record<string, string> = {}
  const linkRegex = /href="(\/Images\/\d+[^"]*\.pdf)"/gi
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(html)) !== null) {
    const path = match[1]
    for (const code of SUPPORTED_CODES) {
      if (!result[code] && path.includes(`-${code}-`)) {
        result[code] = BASE_URL + path
      }
    }
  }

  return result
}

async function scrapeSeasonYear(season: string, year: string, pageUrl: string) {
  const seasonDir = join(RAW_DIR, season, year)
  mkdirSync(seasonDir, { recursive: true })

  let discovered: Record<string, string>
  try {
    discovered = await discoverPdfUrls(pageUrl)
  } catch (err) {
    console.error(`  ✗  ${season}/${year}: page fetch failed — ${(err as Error).message}`)
    return
  }

  if (Object.keys(discovered).length === 0) {
    console.log(`  ↷  ${season}/${year}: no matching subjects found on page`)
    return
  }

  for (const [code, url] of Object.entries(discovered)) {
    const dest = join(seasonDir, `${code}.pdf`)
    if (existsSync(dest)) {
      console.log(`  ↷  ${season}/${year}/${code}.pdf — already present, skipping`)
      continue
    }
    try {
      await downloadFile(url, dest)
      console.log(`  ✓  ${season}/${year}/${code}.pdf`)
    } catch (err) {
      console.error(`  ✗  ${season}/${year}/${code}: ${(err as Error).message}`)
    }
  }
}

async function main() {
  console.log('Scraping Cambridge IGCSE grade threshold PDFs...\n')

  // FM: hardcoded URLs (already downloaded)
  console.log('── FM (Feb/March) ──')
  for (const [year, subjects] of Object.entries(THRESHOLD_URLS)) {
    const yearDir = join(RAW_DIR, year)
    mkdirSync(yearDir, { recursive: true })

    for (const [code, url] of Object.entries(subjects)) {
      const dest = join(yearDir, `${code}.pdf`)
      if (existsSync(dest)) {
        console.log(`  ↷  ${year}/${code}.pdf — already present, skipping`)
        continue
      }
      try {
        await downloadFile(url, dest)
        console.log(`  ✓  ${year}/${code}.pdf`)
      } catch (err) {
        console.error(`  ✗  ${year}/${code}: ${(err as Error).message}`)
      }
    }
  }

  // MJ and ON: dynamic discovery from Cambridge's threshold tables pages
  for (const [season, yearMap] of Object.entries(SEASON_PAGES)) {
    console.log(`\n── ${season.toUpperCase()} (${season === 'mj' ? 'May/June' : 'Oct/Nov'}) ──`)
    for (const [year, pageUrl] of Object.entries(yearMap)) {
      await scrapeSeasonYear(season, year, pageUrl)
    }
  }

  console.log('\nScrape complete.')
}

main().catch(console.error)
