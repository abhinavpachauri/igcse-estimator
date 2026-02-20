'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Subject, Paper, Tier, Season, PaperMarkEntry, SubjectEstimateInput } from '@/types'

export interface SelectedSubject {
  subject: Subject
  tier: Tier | null
  selectedPapers: Paper[]
  marks: Record<string, number> // paper.id → raw_mark
}

interface EstimateContextValue {
  step: number
  setStep: (s: number) => void
  selectedSubjects: SelectedSubject[]
  addSubject: (subject: Subject) => void
  removeSubject: (subjectId: string) => void
  setTier: (subjectId: string, tier: Tier | null) => void
  togglePaper: (subjectId: string, paper: Paper, allAvailablePapers?: Paper[]) => void
  setMark: (subjectId: string, paperId: string, mark: number) => void
  buildPayload: () => SubjectEstimateInput[]
  season: Season
  setSeason: (s: Season) => void
  reset: () => void
}

const EstimateContext = createContext<EstimateContextValue | null>(null)

export function EstimateProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(0)
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([])
  const [season, setSeason] = useState<Season>('FM')

  function addSubject(subject: Subject) {
    setSelectedSubjects((prev) => {
      if (prev.find((s) => s.subject.id === subject.id)) return prev
      return [...prev, { subject, tier: null, selectedPapers: [], marks: {} }]
    })
  }

  function removeSubject(subjectId: string) {
    setSelectedSubjects((prev) => prev.filter((s) => s.subject.id !== subjectId))
  }

  function setTier(subjectId: string, tier: Tier | null) {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.subject.id === subjectId
          ? { ...s, tier, selectedPapers: [], marks: {} }
          : s
      )
    )
  }

  function togglePaper(subjectId: string, paper: Paper, allAvailablePapers?: Paper[]) {
    setSelectedSubjects((prev) =>
      prev.map((s) => {
        if (s.subject.id !== subjectId) return s
        const exists = s.selectedPapers.find((p) => p.id === paper.id)
        let selectedPapers = [...s.selectedPapers]
        const marks = { ...s.marks }
        if (exists) {
          selectedPapers = selectedPapers.filter((p) => p.id !== paper.id)
          delete marks[paper.id]
        } else {
          // If this paper belongs to a group, deselect others in the same group first
          if (paper.paper_group && allAvailablePapers) {
            for (const gp of allAvailablePapers) {
              if (gp.paper_group === paper.paper_group && gp.id !== paper.id) {
                selectedPapers = selectedPapers.filter((p) => p.id !== gp.id)
                delete marks[gp.id]
              }
            }
          }
          selectedPapers = [...selectedPapers, paper]
        }
        return { ...s, selectedPapers, marks }
      })
    )
  }

  function setMark(subjectId: string, paperId: string, mark: number) {
    setSelectedSubjects((prev) =>
      prev.map((s) =>
        s.subject.id === subjectId
          ? { ...s, marks: { ...s.marks, [paperId]: mark } }
          : s
      )
    )
  }

  function buildPayload(): SubjectEstimateInput[] {
    return selectedSubjects.map((s) => ({
      subject_id:    s.subject.id,
      subject_code:  s.subject.syllabus_code,
      subject_name:  s.subject.name,
      tier_selected: s.tier,
      paper_marks:   s.selectedPapers.map((p): PaperMarkEntry => ({
        paper_id:         p.id,
        paper_number:     p.paper_number,
        paper_name:       p.name,
        raw_mark:         s.marks[p.id] ?? -1,
        max_raw_mark:     p.max_raw_mark,
        weight_percentage: p.weight_percentage,
        is_ums:           p.is_ums,
      })),
    }))
  }

  function reset() {
    setStep(0)
    setSelectedSubjects([])
    setSeason('MJ')
  }

  return (
    <EstimateContext.Provider
      value={{
        step, setStep,
        selectedSubjects,
        addSubject, removeSubject,
        setTier, togglePaper, setMark,
        buildPayload,
        season, setSeason,
        reset,
      }}
    >
      {children}
    </EstimateContext.Provider>
  )
}

export function useEstimate() {
  const ctx = useContext(EstimateContext)
  if (!ctx) throw new Error('useEstimate must be used within EstimateProvider')
  return ctx
}
