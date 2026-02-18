// ─── Subjects & Papers ─────────────────────────────────────────────────────

export type Tier = 'Core' | 'Extended'
export type Season = 'FM' | 'MJ' | 'ON'
export type Grade = 'A*' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'U'

export interface PaperConfig {
  paper_number: string
  name: string
  tier: Tier | null
  is_ums: boolean
  max_raw_mark: number
  max_ums_mark: number | null
  weight_percentage: number
}

export interface SubjectConfig {
  code: string
  name: string
  has_tiers: boolean
  papers: PaperConfig[]
}

// ─── Database Row Types ─────────────────────────────────────────────────────

export interface Subject {
  id: string
  syllabus_code: string
  name: string
  has_tiers: boolean
}

export interface Paper {
  id: string
  subject_id: string
  paper_number: string
  name: string
  tier: Tier | null
  is_ums: boolean
  max_raw_mark: number
  max_ums_mark: number | null
  weight_percentage: number
}

export interface Series {
  id: string
  year: number
  season: Season
}

export interface GradeThreshold {
  id: string
  paper_id: string
  series_id: string
  grade: Grade
  min_mark: number
}

export interface SubjectThreshold {
  id: string
  subject_id: string
  series_id: string
  tier: Tier | null
  grade: Grade
  min_mark: number
  max_mark: number
}

// ─── Estimation ─────────────────────────────────────────────────────────────

export interface PaperMarkEntry {
  paper_id: string
  paper_number: string
  paper_name: string
  raw_mark: number
  max_raw_mark: number
  weight_percentage: number
  is_ums: boolean
}

export interface SubjectEstimateInput {
  subject_id: string
  subject_code: string
  subject_name: string
  tier_selected: Tier | null
  paper_marks: PaperMarkEntry[]
}

export interface GradeThresholdSummary {
  grade: Grade
  averaged_pct: number
  min_pct: number
  max_pct: number
  year_data: { year: number; pct: number }[]
}

export interface SubjectEstimateResult {
  subject_id: string
  subject_code: string
  subject_name: string
  tier_selected: Tier | null
  weighted_total_pct: number
  estimated_grade: Grade | null
  thresholds: GradeThresholdSummary[]
  missing_papers: boolean
}

export interface EstimateResult {
  entries: SubjectEstimateResult[]
  calculated_at: string
}

// ─── Saved Estimates ────────────────────────────────────────────────────────

export interface SavedEstimate {
  id: string
  user_id: string | null
  session_id: string | null
  label: string | null
  created_at: string
  entries?: EstimateEntry[]
}

export interface EstimateEntry {
  id: string
  estimate_id: string
  subject_id: string
  tier_selected: Tier | null
  paper_marks: PaperMarkEntry[]
}

// ─── API Payloads ───────────────────────────────────────────────────────────

export interface CalculatePayload {
  entries: SubjectEstimateInput[]
}

export interface SaveEstimatePayload {
  session_id?: string
  label?: string
  entries: SubjectEstimateInput[]
  result: EstimateResult
}
