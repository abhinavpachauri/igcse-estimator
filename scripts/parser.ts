/**
 * parser.ts
 *
 * Reads Cambridge IGCSE grade threshold PDFs from scripts/raw/{year}/{code}.pdf,
 * extracts overall grade thresholds, and writes to scripts/parsed/.
 *
 * Handles two PDF formats:
 *   2023+ format — max_mark_after_weighting is a column in the option table
 *   2022 format  — max_mark is in a separate sentence before the option table
 *
 * Run with: pnpm pipeline:parse
 */

import { createRequire } from 'module'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const require  = createRequire(import.meta.url)
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
  options?: { max?: number }
) => Promise<{ text: string; numpages: number }>

const __dirname  = dirname(fileURLToPath(import.meta.url))
const RAW_DIR    = join(__dirname, 'raw')
const PARSED_DIR = join(__dirname, 'parsed')

// ── Types ────────────────────────────────────────────────────────────────────

export interface ParsedThreshold {
  syllabus_code: string
  season:        'FM' | 'MJ' | 'ON'
  year:          number
  tier:          'Core' | 'Extended' | null
  option_code:   string
  max_mark:      number
  grades:        { grade: string; min_mark: number }[]
}

export interface ParsedComponent {
  syllabus_code:  string
  year:           number
  component_code: string
  paper_number:   string
  max_mark:       number
}

// ── Config ───────────────────────────────────────────────────────────────────

const GRADE_ORDER = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

// For tiered subjects: which option-code prefixes map to Core / Extended
const TIER_MAP: Record<string, { core: string[]; extended: string[] }> = {
  '0580': { core: ['A'],       extended: ['B']       }, // Maths
  '0610': { core: ['F', 'G'], extended: ['B', 'C']  }, // Biology
  '0620': { core: ['F', 'G'], extended: ['B', 'C']  }, // Chemistry
  '0625': { core: ['F', 'G'], extended: ['B', 'C']  }, // Physics
  '0653': { core: ['F', 'G'], extended: ['B', 'C']  }, // Combined Science
}

// For non-tiered subjects with multiple options, prefer this prefix
const PREFERRED_PREFIX: Record<string, string> = {
  '0500': 'B', // English: BY = Papers 1+2, no coursework
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract all integer and dash tokens from a string. */
function extractTokens(str: string): (number | null)[] {
  const tokens: (number | null)[] = []
  for (const match of str.matchAll(/\d+|[\u2013\u2014\u002D]/g)) {
    const t = match[0]
    tokens.push(/\d+/.test(t) ? parseInt(t, 10) : null)
  }
  return tokens
}

/**
 * Detect how many grade columns are in the overall table by looking for
 * the header line containing "A*" in the table header area.
 * Returns 8 (full A*–G) or 6 (A*–E for subjects like Additional Maths).
 */
function detectGradeCount(overallSection: string): number {
  // Grab the first 600 chars — enough to cover the table header
  const head = overallSection.slice(0, 600)
  if (/A\*[\s\S]{0,80}F[\s\S]{0,20}G/m.test(head)) return 8
  return 6
}

// ── Component parsing ────────────────────────────────────────────────────────

function parseComponentTable(text: string): { code: string; maxMark: number }[] {
  const overallIdx = text.toLowerCase().indexOf('overall threshold')
  const section    = overallIdx !== -1 ? text.slice(0, overallIdx) : text
  const results: { code: string; maxMark: number }[] = []
  for (const line of section.split('\n')) {
    const m = line.trim().match(/^Component\s+(\d{2,3})\s+(\d+)/)
    if (m) results.push({ code: m[1], maxMark: parseInt(m[2], 10) })
  }
  return results
}

// ── Max-mark extraction (2022 format) ────────────────────────────────────────

interface MaxMarkByTier {
  default:   number
  Core?:     number
  Extended?: number
}

/**
 * For 2022 PDFs that don't embed max_mark in the option row, extract it from
 * the sentence "The maximum total mark for this syllabus, after weighting has
 * been applied, is X [for the Extended option and Y for the Core option]."
 */
function extract2022MaxMarks(text: string): MaxMarkByTier | null {
  // Case 1: two different values: "is 200 for the Extended option and 160 for the Core option"
  const twoValMatch = text.match(
    /maximum\s+total\s+mark[^.]*?is\s+(\d{2,3})\s+for\s+the\s+(\w+)\s+option\s+and\s+(\d{2,3})\s+for\s+the\s+(\w+)\s+option/i
  )
  if (twoValMatch) {
    const result: MaxMarkByTier = { default: Math.max(parseInt(twoValMatch[1]), parseInt(twoValMatch[3])) }
    const assign = (mark: string, tier: string) => {
      if (/extended/i.test(tier)) result.Extended = parseInt(mark)
      if (/core/i.test(tier))     result.Core     = parseInt(mark)
    }
    assign(twoValMatch[1], twoValMatch[2])
    assign(twoValMatch[3], twoValMatch[4])
    return result
  }

  // Case 2: single value: "is 200"
  const oneValMatch = text.match(/maximum\s+total\s+mark[^.]*?is\s+(\d{2,3})\b/i)
  if (oneValMatch) return { default: parseInt(oneValMatch[1]) }

  return null
}

// ── Overall table parsing ────────────────────────────────────────────────────

interface RawOption {
  code:    string
  maxMark: number
  grades:  (number | null)[]
}

function parseOverallOptions(text: string): RawOption[] {
  const overallIdx = text.toLowerCase().indexOf('overall threshold')
  if (overallIdx === -1) return []

  const section         = text.slice(overallIdx)
  const hasMaxMarkCol   = /maximum\s+mark\s+after\s+weighting/i.test(section)
  const numGrades       = detectGradeCount(section)
  const externalMarks   = hasMaxMarkCol ? null : extract2022MaxMarks(text)

  const options: RawOption[] = []

  for (const line of section.split('\n')) {
    const trimmed = line.trim()

    // Option rows: 1–3 uppercase letters, optionally followed by (XX)
    const optMatch = trimmed.match(/^([A-Z]{1,3})(?:\s*\([^)]*\))?/)
    if (!optMatch) continue

    const code   = optMatch[1]
    const rest   = trimmed.slice(optMatch[0].length).trim()
    const tokens = extractTokens(rest)

    // Need at least max_mark (2023+) or components (2022) + grades
    if (tokens.length < numGrades) continue

    let maxMark: number
    let gradeTokens: (number | null)[]

    if (hasMaxMarkCol) {
      // 2023+ format: first number = max_mark, last numGrades = grades
      const firstNum = tokens[0]
      if (firstNum === null || firstNum < 10) continue
      maxMark     = firstNum
      gradeTokens = tokens.slice(-numGrades)
    } else {
      // 2022 format: no max_mark in row — use external value
      if (!externalMarks) continue
      maxMark     = externalMarks.default
      gradeTokens = tokens.slice(-numGrades)
    }

    if (gradeTokens.length < numGrades) continue

    options.push({ code, maxMark, grades: gradeTokens })
  }

  return options
}

// ── Tier selection ───────────────────────────────────────────────────────────

/**
 * Given parsed raw options and the subject code, return final ParsedThreshold
 * entries with correct tier assignments and max_marks.
 *
 * For tiered subjects: emit one Core entry and one Extended entry.
 * For non-tiered: emit one entry with tier = null.
 */
function selectThresholds(
  options:       RawOption[],
  code:          string,
  year:          number,
  externalMarks: MaxMarkByTier | null,
  season:        'FM' | 'MJ' | 'ON' = 'FM',
): ParsedThreshold[] {
  if (options.length === 0) return []

  const toThreshold = (
    opt:     RawOption,
    tier:    'Core' | 'Extended' | null,
    maxMark: number,
  ): ParsedThreshold => ({
    syllabus_code: code,
    season,
    year,
    tier,
    option_code:   opt.code,
    max_mark:      maxMark,
    grades: GRADE_ORDER
      .map((g, i): { grade: string; min_mark: number | null } => ({ grade: g, min_mark: opt.grades[i] }))
      .filter((g): g is { grade: string; min_mark: number } =>
        g.min_mark !== null && g.min_mark > 0
      ),
  })

  const tierMap = TIER_MAP[code]

  if (tierMap) {
    // Tiered subject: find best Core and Extended options
    const isTier = (opt: RawOption, prefixes: string[]) =>
      prefixes.some(p => opt.code.startsWith(p))

    const pickBest = (opts: RawOption[]) =>
      opts.find(o => o.code.endsWith('Y')) ?? opts[0]

    const coreOpts     = options.filter(o => isTier(o, tierMap.core))
    const extendedOpts = options.filter(o => isTier(o, tierMap.extended))
    const coreOpt      = pickBest(coreOpts)
    const extOpt       = pickBest(extendedOpts)

    const result: ParsedThreshold[] = []

    if (coreOpt) {
      const mm = externalMarks?.Core ?? coreOpt.maxMark
      result.push(toThreshold(coreOpt, 'Core', mm))
    }
    if (extOpt) {
      const mm = externalMarks?.Extended ?? extOpt.maxMark
      result.push(toThreshold(extOpt, 'Extended', mm))
    }

    return result
  }

  // Non-tiered: pick one preferred option
  const pref     = PREFERRED_PREFIX[code] ?? 'A'
  const prefixed = options.filter(o => o.code.startsWith(pref))
  const fallback = options.filter(o => !o.code.startsWith(pref))
  const pickY    = (opts: RawOption[]) =>
    opts.find(o => o.code.endsWith('Y')) ?? opts[0]

  const opt = pickY(prefixed) ?? pickY(fallback) ?? options[0]
  const mm  = externalMarks?.default ?? opt.maxMark

  return opt ? [toThreshold(opt, null, mm)] : []
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface ScanTarget {
  label:  string
  dir:    string
  season: 'FM' | 'MJ' | 'ON'
}

async function parsePdfsInDir(
  target:        ScanTarget,
  allThresholds: ParsedThreshold[],
  allComponents: ParsedComponent[],
) {
  if (!existsSync(target.dir)) return

  const yearDirs = readdirSync(target.dir).filter(d => /^\d{4}$/.test(d)).sort()
  if (yearDirs.length === 0) return

  for (const yearDir of yearDirs) {
    const year     = parseInt(yearDir, 10)
    const fullPath = join(target.dir, yearDir)
    const pdfs     = readdirSync(fullPath).filter(f => f.endsWith('.pdf'))

    console.log(`\nParsing ${target.label}/${yearDir} (${pdfs.length} PDFs)...`)

    for (const pdfFile of pdfs) {
      const code     = pdfFile.replace('.pdf', '')
      const filePath = join(fullPath, pdfFile)

      try {
        const buffer    = readFileSync(filePath)
        const { text }  = await pdfParse(buffer, { max: 1 })

        // Components (only from FM to avoid duplicates)
        if (target.season === 'FM') {
          for (const c of parseComponentTable(text)) {
            const raw      = c.code.replace(/^0+/, '')
            const paperNum = raw.charAt(0) || c.code.charAt(0)
            allComponents.push({ syllabus_code: code, year, component_code: c.code, paper_number: paperNum, max_mark: c.maxMark })
          }
        }

        // Overall thresholds
        const overallIdx    = text.toLowerCase().indexOf('overall threshold')
        const hasMaxMarkCol = overallIdx !== -1 && /maximum\s+mark\s+after\s+weighting/i.test(text.slice(overallIdx))
        const externalMarks = hasMaxMarkCol ? null : extract2022MaxMarks(text)

        const rawOptions = parseOverallOptions(text)
        const thresholds = selectThresholds(rawOptions, code, year, externalMarks, target.season)

        if (thresholds.length === 0) {
          console.warn(`  ⚠  ${target.label}/${yearDir}/${code}.pdf — no overall thresholds found`)
        } else {
          const summary = thresholds.map(t => t.tier ?? 'no-tier').join('+')
          const marks   = thresholds.map(t => `${t.max_mark}`).join('/')
          console.log(`  ✓  ${code} (${summary}) max=${marks}`)
          allThresholds.push(...thresholds)
        }
      } catch (err) {
        console.error(`  ✗  ${target.label}/${yearDir}/${code}.pdf — ${(err as Error).message}`)
      }
    }
  }
}

async function main() {
  mkdirSync(PARSED_DIR, { recursive: true })

  if (!existsSync(RAW_DIR)) {
    console.log('No raw directory found. Run pnpm pipeline:scrape first.')
    return
  }

  const allThresholds: ParsedThreshold[] = []
  const allComponents: ParsedComponent[] = []

  const targets: ScanTarget[] = [
    { label: 'fm', dir: RAW_DIR,              season: 'FM' },
    { label: 'mj', dir: join(RAW_DIR, 'mj'),  season: 'MJ' },
    { label: 'on', dir: join(RAW_DIR, 'on'),  season: 'ON' },
  ]

  for (const target of targets) {
    await parsePdfsInDir(target, allThresholds, allComponents)
  }

  if (allThresholds.length === 0) {
    console.log('No PDFs found. Run pnpm pipeline:scrape first.')
    return
  }

  writeFileSync(join(PARSED_DIR, 'thresholds.json'), JSON.stringify(allThresholds, null, 2))
  writeFileSync(join(PARSED_DIR, 'components.json'), JSON.stringify(allComponents, null, 2))

  console.log(`\n── Summary ────────────────────────────────────────`)
  console.log(`Overall thresholds: ${allThresholds.length} rows`)
  console.log(`Component maxima:   ${allComponents.length} rows`)

  const bySeason: Record<string, number> = {}
  for (const t of allThresholds) {
    bySeason[t.season] = (bySeason[t.season] ?? 0) + 1
  }
  console.log('\nRows by season:', bySeason)
}

main().catch(console.error)
