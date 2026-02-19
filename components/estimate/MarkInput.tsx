'use client'

import { motion } from 'framer-motion'
import { useEstimate } from './EstimateContext'
import { Button, Input } from '@/components/ui'

export function MarkInput() {
  const { selectedSubjects, setMark, setStep, buildPayload } = useEstimate()

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
        {selectedSubjects.map((ss, i) => (
          <motion.div
            key={ss.subject.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-sm border p-6"
            style={{ background: '#141414', borderColor: '#2A2A2A' }}
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
                        style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
                      >
                        {((markValue / paper.max_raw_mark) * paper.weight_percentage).toFixed(1)}%
                        <div style={{ color: '#3D3D3D' }}>weighted</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Running weighted total */}
            {ss.selectedPapers.length > 0 && (
              <div className="mt-5 pt-4 flex justify-end" style={{ borderTop: '1px solid #1E1E1E' }}>
                <div className="text-right">
                  <div className="text-xs mb-1" style={{ color: '#555', fontFamily: 'var(--font-sans)' }}>
                    Running weighted total
                  </div>
                  <div className="font-display text-2xl" style={{ color: '#C9A96E' }}>
                    {ss.selectedPapers
                      .reduce((sum, p) => {
                        const m = ss.marks[p.id]
                        if (m === undefined || m < 0) return sum
                        return sum + (m / p.max_raw_mark) * p.weight_percentage
                      }, 0)
                      .toFixed(1)}
                    <span className="text-base font-light" style={{ color: '#555' }}>%</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #1E1E1E' }}>
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
