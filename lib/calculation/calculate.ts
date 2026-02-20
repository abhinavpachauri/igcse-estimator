import type {
  SubjectEstimateInput,
  SubjectEstimateResult,
  EstimateResult,
  GradeThresholdSummary,
  Grade,
  Season,
} from '@/types'
import { averageThresholds } from './average-thresholds'
import { createClient } from '@/lib/supabase/server'

const GRADE_ORDER: Grade[] = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U']

/**
 * Main entry point. Accepts a list of subject entries with marks entered,
 * returns estimated grades with threshold data.
 */
export async function calculateEstimate(
  entries: SubjectEstimateInput[],
  season: Season = 'FM'
): Promise<EstimateResult> {
  const supabase = await createClient()

  const results = await Promise.all(
    entries.map((entry) => calculateSubjectGrade(entry, supabase, season))
  )

  return {
    entries: results,
    calculated_at: new Date().toISOString(),
  }
}

async function calculateSubjectGrade(
  entry: SubjectEstimateInput,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  season: Season = 'FM'
): Promise<SubjectEstimateResult> {
  const { subject_id, subject_code, subject_name, tier_selected, paper_marks } = entry

  // 1. Calculate the user's weighted total as a percentage (0–100)
  let weightedTotal = 0
  let totalWeight = 0
  const missingPapers = paper_marks.some((pm) => pm.raw_mark < 0)

  for (const pm of paper_marks) {
    if (pm.raw_mark < 0 || pm.max_raw_mark <= 0) continue
    const normalised = Math.min(pm.raw_mark / pm.max_raw_mark, 1)
    weightedTotal += normalised * pm.weight_percentage
    totalWeight += pm.weight_percentage
  }

  // Scale to 100 if weights don't add to exactly 100 (handles partial paper entry)
  if (totalWeight > 0 && totalWeight < 100) {
    weightedTotal = (weightedTotal / totalWeight) * 100
  }

  // 2. Fetch averaged historical thresholds for this subject
  const thresholds = await averageThresholds(supabase, subject_id, tier_selected, season)

  // 3. Determine estimated grade
  let estimatedGrade: Grade | null = null

  for (const g of GRADE_ORDER) {
    const t = thresholds.find((t) => t.grade === g)
    if (t && weightedTotal >= t.averaged_pct) {
      estimatedGrade = g
      break
    }
  }

  return {
    subject_id,
    subject_code,
    subject_name,
    tier_selected,
    weighted_total_pct: Math.round(weightedTotal * 10) / 10,
    estimated_grade: estimatedGrade,
    thresholds,
    missing_papers: missingPapers,
  }
}

/**
 * Reverse calculator: given a target grade and current marks for some papers,
 * what raw mark is needed on a specific paper to achieve the grade?
 */
export function reverseCalculate({
  targetGradePct,
  currentWeightedPct,
  targetPaperWeight,
  targetPaperMaxMark,
}: {
  targetGradePct: number
  currentWeightedPct: number
  targetPaperWeight: number
  targetPaperMaxMark: number
}): { needed_raw: number; needed_pct: number; achievable: boolean } {
  // How much weighted % still needs to come from the target paper
  const needed_weighted = targetGradePct - currentWeightedPct
  // As a fraction of the paper's weight
  const needed_fraction = needed_weighted / targetPaperWeight
  const needed_pct = Math.round(needed_fraction * 100 * 10) / 10
  const needed_raw = Math.ceil(needed_fraction * targetPaperMaxMark)

  return {
    needed_raw: Math.max(0, needed_raw),
    needed_pct: Math.max(0, needed_pct),
    achievable: needed_raw <= targetPaperMaxMark && needed_fraction <= 1,
  }
}
