'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useEstimate } from './EstimateContext'
import { Button } from '@/components/ui'
import type { Paper, Tier } from '@/types'

interface SubjectPapers {
  [subjectId: string]: Paper[]
}

function getAvailablePapers(papers: Paper[], hasTiers: boolean, tier: Tier | null): Paper[] {
  if (hasTiers && tier) return papers.filter((p) => p.tier === tier)
  if (hasTiers && !tier) return []
  return papers
}

function getSubjectReadiness(selectedPaperIds: Set<string>, availablePapers: Paper[]) {
  const compulsory = availablePapers.filter((p) => !p.paper_group)
  const groups = [...new Set(availablePapers.filter((p) => p.paper_group).map((p) => p.paper_group!))]

  const required = compulsory.length + groups.length
  const compulsoryMet = compulsory.filter((p) => selectedPaperIds.has(p.id)).length
  const groupsMet = groups.filter(
    (g) => availablePapers.filter((p) => p.paper_group === g && selectedPaperIds.has(p.id)).length === 1
  ).length
  const satisfied = compulsoryMet + groupsMet

  return { required, satisfied, complete: required > 0 && satisfied === required }
}

export function PaperSelector() {
  const { selectedSubjects, setTier, togglePaper, setStep } = useEstimate()
  const [papersBySubject, setPapersBySubject] = useState<SubjectPapers>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPapers() {
      const results: SubjectPapers = {}
      await Promise.all(
        selectedSubjects.map(async ({ subject }) => {
          const r = await fetch(`/api/subjects/${subject.syllabus_code}`)
          const data = await r.json()
          results[subject.id] = data.papers ?? []
        })
      )
      setPapersBySubject(results)
      setLoading(false)
    }
    fetchPapers()
  }, [selectedSubjects])

  const canContinue = selectedSubjects.every((s) => {
    if (s.subject.has_tiers && !s.tier) return false
    const papers = papersBySubject[s.subject.id] ?? []
    const available = getAvailablePapers(papers, s.subject.has_tiers, s.tier)
    const selectedIds = new Set(s.selectedPapers.map((p) => p.id))
    return getSubjectReadiness(selectedIds, available).complete
  })

  if (loading) {
    return (
      <div className="space-y-6">
        {selectedSubjects.map((s) => (
          <div key={s.subject.id} className="p-6 rounded-sm animate-pulse" style={{ background: '#141414' }}>
            <div className="h-5 w-32 rounded mb-4" style={{ background: '#2A2A2A' }} />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded" style={{ background: '#1A1A1A' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-3xl font-light mb-2" style={{ color: '#F5F5F0' }}>
          Choose your papers
        </h2>
        <p className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
          Select your tier (if applicable) and the papers you are sitting.
        </p>
      </div>

      <div className="space-y-5">
        {selectedSubjects.map((ss, i) => {
          const papers = papersBySubject[ss.subject.id] ?? []
          const availablePapers = getAvailablePapers(papers, ss.subject.has_tiers, ss.tier)
          const selectedIds = new Set(ss.selectedPapers.map((p) => p.id))
          const { required, satisfied, complete } = getSubjectReadiness(selectedIds, availablePapers)

          const compulsoryPapers = availablePapers.filter((p) => !p.paper_group)
          const groups = [...new Set(availablePapers.filter((p) => p.paper_group).map((p) => p.paper_group!))]

          return (
            <motion.div
              key={ss.subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-sm border p-6"
              style={{
                background: '#141414',
                borderColor: '#2A2A2A',
                boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              {/* Subject header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="text-xs tracking-wider mb-0.5" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
                    {ss.subject.syllabus_code}
                  </div>
                  <div className="font-display text-xl" style={{ color: '#F5F5F0' }}>
                    {ss.subject.name}
                  </div>
                </div>
                {required > 0 && (
                  <div
                    className="text-xs px-2.5 py-1 rounded-sm flex-shrink-0"
                    style={{
                      background: complete ? 'rgba(76,175,120,0.1)' : 'rgba(201,169,110,0.08)',
                      border: `1px solid ${complete ? 'rgba(76,175,120,0.2)' : 'rgba(201,169,110,0.2)'}`,
                      color: complete ? '#4CAF78' : '#C9A96E',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {satisfied} / {required} required
                  </div>
                )}
              </div>

              {/* Tier selection */}
              {ss.subject.has_tiers && (
                <div className="mb-5">
                  <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                    Tier
                  </div>
                  <div className="flex gap-3">
                    {(['Core', 'Extended'] as Tier[]).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setTier(ss.subject.id, tier)}
                        className="flex-1 py-3 text-sm rounded-sm border transition-all duration-200 cursor-pointer font-medium tracking-wide"
                        style={{
                          fontFamily: 'var(--font-sans)',
                          background: ss.tier === tier
                            ? 'linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.06) 100%)'
                            : 'rgba(255,255,255,0.02)',
                          borderColor: ss.tier === tier ? 'rgba(201,169,110,0.5)' : '#2A2A2A',
                          color: ss.tier === tier ? '#C9A96E' : '#555',
                          boxShadow: ss.tier === tier ? '0 0 16px rgba(201,169,110,0.08)' : 'none',
                        }}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Papers */}
              {availablePapers.length > 0 ? (
                <div className="space-y-4">
                  {/* Compulsory papers */}
                  {compulsoryPapers.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                        Papers
                      </div>
                      <div className="space-y-2">
                        {compulsoryPapers.map((paper) => {
                          const isSelected = selectedIds.has(paper.id)
                          return (
                            <PaperButton
                              key={paper.id}
                              paper={paper}
                              isSelected={isSelected}
                              isRadio={false}
                              onClick={() => togglePaper(ss.subject.id, paper, availablePapers)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Grouped papers */}
                  {groups.map((group) => {
                    const groupPapers = availablePapers.filter((p) => p.paper_group === group)
                    const groupLabel = group === 'practical' ? 'Practical component' : 'Coursework component'
                    return (
                      <div key={group}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-xs uppercase tracking-widest" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                            {groupLabel}
                          </div>
                          <div
                            className="text-xs px-2 py-0.5 rounded-sm"
                            style={{
                              background: 'rgba(201,169,110,0.06)',
                              border: '1px solid rgba(201,169,110,0.15)',
                              color: '#C9A96E',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            choose one
                          </div>
                        </div>
                        <div className="space-y-2">
                          {groupPapers.map((paper) => {
                            const isSelected = selectedIds.has(paper.id)
                            return (
                              <PaperButton
                                key={paper.id}
                                paper={paper}
                                isSelected={isSelected}
                                isRadio={true}
                                onClick={() => togglePaper(ss.subject.id, paper, availablePapers)}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : ss.subject.has_tiers && !ss.tier ? (
                <p className="text-sm py-3" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  Select a tier above to see available papers.
                </p>
              ) : null}
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #1E1E1E' }}>
        <Button variant="ghost" size="md" onClick={() => setStep(0)}>
          Back
        </Button>
        <Button variant="primary" size="md" disabled={!canContinue} onClick={() => setStep(2)}>
          Continue
        </Button>
      </div>
    </div>
  )
}

interface PaperButtonProps {
  paper: Paper
  isSelected: boolean
  isRadio: boolean
  onClick: () => void
}

function PaperButton({ paper, isSelected, isRadio, onClick }: PaperButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 rounded-sm border flex items-center justify-between transition-all duration-200 cursor-pointer group"
      style={{
        background: isSelected ? 'rgba(201,169,110,0.05)' : 'rgba(255,255,255,0.02)',
        borderColor: isSelected ? 'rgba(201,169,110,0.3)' : '#2A2A2A',
        borderLeft: isSelected ? '2px solid #C9A96E' : '2px solid transparent',
      }}
    >
      <div>
        <div
          className="text-sm"
          style={{
            color: isSelected ? '#F5F5F0' : '#A8A8A8',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {paper.name}
        </div>
        <div
          className="text-xs mt-0.5"
          style={{ color: isSelected ? 'rgba(201,169,110,0.6)' : '#555', fontFamily: 'var(--font-sans)' }}
        >
          Max {paper.max_raw_mark} marks · {paper.weight_percentage}% weight
        </div>
      </div>
      {/* Checkbox or radio indicator */}
      {isRadio ? (
        <div
          className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200 ml-3"
          style={{
            borderColor: isSelected ? '#C9A96E' : '#2A2A2A',
            background: isSelected ? '#C9A96E' : 'transparent',
            boxShadow: isSelected ? '0 0 8px rgba(201,169,110,0.3)' : 'none',
          }}
        >
          {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: '#0C0C0C' }} />}
        </div>
      ) : (
        <div
          className="w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all duration-200 ml-3"
          style={{
            borderColor: isSelected ? '#C9A96E' : '#2A2A2A',
            background: isSelected ? '#C9A96E' : 'transparent',
            boxShadow: isSelected ? '0 0 8px rgba(201,169,110,0.3)' : 'none',
          }}
        >
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="#0C0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      )}
    </button>
  )
}
