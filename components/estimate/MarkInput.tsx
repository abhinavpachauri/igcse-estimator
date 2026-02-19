'use client'

import { motion } from 'framer-motion'
import { useEstimate } from './EstimateContext'
import { Button, Input } from '@/components/ui'

export function MarkInput() {
  const { selectedSubjects, setMark, setStep } = useEstimate()

  const canContinue = selectedSubjects.every((s) =>
    s.selectedPapers.every((p) => {
      const mark = s.marks[p.id]
      return mark !== undefined && mark >= 0 && mark <= p.max_raw_mark
    })
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-3xl font-light mb-2" style={{ color: '#F5F5F0' }}>
          Enter your estimated marks
        </h2>
        <p className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
          Enter your estimated raw mark for each paper. Marks are weighted automatically.
        </p>
      </div>

      <div className="space-y-5">
        {selectedSubjects.map((ss, i) => {
          const weightedTotal = ss.selectedPapers.reduce((sum, p) => {
            const m = ss.marks[p.id]
            if (m === undefined || m < 0) return sum
            return sum + (m / p.max_raw_mark) * p.weight_percentage
          }, 0)

          const totalFilledPapers = ss.selectedPapers.filter((p) => {
            const m = ss.marks[p.id]
            return m !== undefined && m >= 0
          }).length

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
              <div className="mb-5">
                <div className="text-xs tracking-wider mb-0.5" style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}>
                  {ss.subject.syllabus_code}{ss.tier ? ` · ${ss.tier}` : ''}
                </div>
                <div className="font-display text-xl" style={{ color: '#F5F5F0' }}>
                  {ss.subject.name}
                </div>
              </div>

              <div className="space-y-4">
                {ss.selectedPapers.map((paper) => {
                  const markValue = ss.marks[paper.id]
                  const isOver = markValue !== undefined && markValue > paper.max_raw_mark

                  return (
                    <div key={paper.id} className="flex items-end gap-4">
                      <div className="flex-1">
                        <Input
                          label={paper.name}
                          type="number"
                          min={0}
                          max={paper.max_raw_mark}
                          value={markValue === undefined || markValue < 0 ? '' : markValue}
                          onChange={(e) => {
                            const val = e.target.value === '' ? -1 : parseInt(e.target.value, 10)
                            setMark(ss.subject.id, paper.id, val)
                          }}
                          suffix={`/ ${paper.max_raw_mark}`}
                          error={isOver ? `Maximum is ${paper.max_raw_mark}` : undefined}
                          hint={`Weight: ${paper.weight_percentage}%`}
                          placeholder="0"
                        />
                      </div>

                      {/* Normalised preview */}
                      {markValue !== undefined && markValue >= 0 && !isOver && (
                        <div
                          className="pb-8 text-xs text-right w-16 flex-shrink-0"
                          style={{ color: '#C9A96E', fontFamily: 'var(--font-sans)' }}
                        >
                          <div className="font-display text-sm">
                            {((markValue / paper.max_raw_mark) * paper.weight_percentage).toFixed(1)}%
                          </div>
                          <div style={{ color: '#3D3D3D' }}>weighted</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Running weighted total with progress bar */}
              {ss.selectedPapers.length > 0 && (
                <div className="mt-5 pt-4" style={{ borderTop: '1px solid #1E1E1E' }}>
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                        Weighted total
                        {totalFilledPapers < ss.selectedPapers.length && (
                          <span style={{ color: '#3D3D3D' }}>
                            {' '}({totalFilledPapers}/{ss.selectedPapers.length} entered)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-display text-2xl" style={{ color: '#C9A96E' }}>
                      {weightedTotal.toFixed(1)}
                      <span className="text-base font-light" style={{ color: '#555' }}>%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: '#1A1A1A' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: weightedTotal >= 70
                          ? 'linear-gradient(to right, #C9A96E, rgba(201,169,110,0.5))'
                          : weightedTotal >= 50
                          ? 'linear-gradient(to right, #A9B8C9, rgba(169,184,201,0.5))'
                          : 'linear-gradient(to right, #888, rgba(136,136,136,0.4))',
                        boxShadow: weightedTotal >= 70 ? '0 0 8px rgba(201,169,110,0.4)' : 'none',
                      }}
                      animate={{ width: `${Math.min(weightedTotal, 100)}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #1E1E1E' }}>
        <Button variant="ghost" size="md" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={!canContinue}
          onClick={() => setStep(3)}
        >
          Review
        </Button>
      </div>
    </div>
  )
}
