import type { Grade, GradeThresholdSummary, Tier } from '@/types'

const GRADE_ORDER: Grade[] = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G']

/**
 * Fetches subject-level overall thresholds from the DB for the past N FM series,
 * converts each year's threshold mark to a percentage of the overall max mark,
 * then returns the mean + range per grade.
 */
export async function averageThresholds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  subjectId: string,
  tier: Tier | null,
  season: string = 'FM',
  numYears: number = 5
): Promise<GradeThresholdSummary[]> {
  // Get the most recent N series for the given season
  const { data: seriesData, error: seriesError } = await supabase
    .from('series')
    .select('id, year')
    .eq('season', season)
    .order('year', { ascending: false })
    .limit(numYears)

  if (seriesError || !seriesData || seriesData.length === 0) {
    return []
  }

  const seriesIds = seriesData.map((s: { id: string }) => s.id)

  // Fetch overall subject thresholds for those series
  let query = supabase
    .from('subject_thresholds')
    .select('grade, min_mark, max_mark, series_id')
    .eq('subject_id', subjectId)
    .in('series_id', seriesIds)

  // Supabase builder methods return new objects — must reassign
  if (tier) {
    query = query.eq('tier', tier)
  } else {
    query = query.is('tier', null)
  }

  const { data: thresholdRows, error: thresholdError } = await query

  if (thresholdError || !thresholdRows || thresholdRows.length === 0) {
    return []
  }

  // Build a map of seriesId → year
  const seriesYearMap: Record<string, number> = {}
  for (const s of seriesData) {
    seriesYearMap[s.id] = s.year
  }

  // Group by grade, compute percentage per year
  const gradeMap: Record<Grade, { year: number; pct: number }[]> = {} as never

  for (const row of thresholdRows) {
    const grade = row.grade as Grade
    if (!gradeMap[grade]) gradeMap[grade] = []

    const pct =
      row.max_mark > 0
        ? Math.round((row.min_mark / row.max_mark) * 1000) / 10
        : 0

    gradeMap[grade].push({
      year: seriesYearMap[row.series_id] ?? 0,
      pct,
    })
  }

  // Compute averages and ranges
  const summaries: GradeThresholdSummary[] = []

  for (const grade of GRADE_ORDER) {
    const yearData = gradeMap[grade]
    if (!yearData || yearData.length === 0) continue

    const pcts = yearData.map((d) => d.pct)
    const averaged_pct = Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10
    const min_pct = Math.min(...pcts)
    const max_pct = Math.max(...pcts)

    summaries.push({
      grade,
      averaged_pct,
      min_pct,
      max_pct,
      year_data: yearData.sort((a, b) => a.year - b.year),
    })
  }

  // Sort by grade order (A* first)
  return summaries.sort(
    (a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade)
  )
}
