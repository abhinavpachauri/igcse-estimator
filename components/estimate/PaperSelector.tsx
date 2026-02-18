'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useEstimate } from './EstimateContext'
import { Button } from '@/components/ui'
import type { Paper, Tier } from '@/types'

interface SubjectPapers {
  [subjectId: string]: Paper[]
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
    // If subject has tiers, a tier must be selected
    if (s.subject.has_tiers && !s.tier) return false
    // At least one paper must be selected
    return s.selectedPapers.length > 0
  })

  if (loading) {
    return (
      <div className="space-y-6">
        {selectedSubjects.map((s) => (
          <div key={s.subject.id} className="p-6 rounded-sm animate-pulse" style={{ background: '#141414' }}>
            <div className="h-5 w-32 rounded mb-4" style={{ background: '#2A2A2A' }} />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded" style={{ background: '#1A1A1A' }} />
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
          const availablePapers = ss.subject.has_tiers && ss.tier
            ? papers.filter((p) => p.tier === ss.tier)
            : ss.subject.has_tiers
            ? []
            : papers

          return (
            <motion.div
              key={ss.subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-sm border p-6"
              style={{ background: '#141414', borderColor: '#2A2A2A' }}
            >
              {/* Subject header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs tracking-wider mb-0.5" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
                    {ss.subject.syllabus_code}
                  </div>
                  <div className="font-display text-xl" style={{ color: '#F5F5F0' }}>
                    {ss.subject.name}
                  </div>
                </div>
              </div>

              {/* Tier selection */}
              {ss.subject.has_tiers && (
                <div className="mb-5">
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                    Tier
                  </div>
                  <div className="flex gap-2">
                    {(['Core', 'Extended'] as Tier[]).map((tier) => (
                      <button
                        key={tier}
                        onClick={() => setTier(ss.subject.id, tier)}
                        className="px-4 py-2 text-sm rounded-sm border transition-all duration-200 cursor-pointer"
                        style={{
                          fontFamily: 'var(--font-sans)',
                          background: ss.tier === tier ? 'rgba(201,169,110,0.1)' : 'transparent',
                          borderColor: ss.tier === tier ? 'rgba(201,169,110,0.5)' : '#2A2A2A',
                          color: ss.tier === tier ? '#C9A96E' : '#888',
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
                <div>
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                    Papers
                  </div>
                  <div className="space-y-2">
                    {availablePapers.map((paper) => {
                      const isSelected = ss.selectedPapers.some((p) => p.id === paper.id)
                      return (
                        <button
                          key={paper.id}
                          onClick={() => togglePaper(ss.subject.id, paper)}
                          className="w-full text-left px-4 py-3 rounded-sm border flex items-center justify-between transition-all duration-200 cursor-pointer"
                          style={{
                            background: isSelected ? 'rgba(201,169,110,0.05)' : '#1A1A1A',
                            borderColor: isSelected ? 'rgba(201,169,110,0.3)' : '#2A2A2A',
                          }}
                        >
                          <div>
                            <div className="text-sm" style={{ color: isSelected ? '#F5F5F0' : '#A8A8A8', fontFamily: 'var(--font-sans)' }}>
                              {paper.name}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                              Max {paper.max_raw_mark} marks · {paper.weight_percentage}%
                            </div>
                          </div>
                          <div
                            className="w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all duration-200"
                            style={{
                              borderColor: isSelected ? '#C9A96E' : '#2A2A2A',
                              background: isSelected ? '#C9A96E' : 'transparent',
                            }}
                          >
                            {isSelected && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="#0C0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : ss.subject.has_tiers && !ss.tier ? (
                <p className="text-sm" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                  Select a tier above to see available papers.
                </p>
              ) : null}
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #1E1E1E' }}>
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
