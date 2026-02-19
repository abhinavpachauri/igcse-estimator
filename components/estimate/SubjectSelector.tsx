'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEstimate } from './EstimateContext'
import { Button } from '@/components/ui'
import type { Subject } from '@/types'

export function SubjectSelector() {
  const { selectedSubjects, addSubject, removeSubject, setStep } = useEstimate()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/subjects')
      .then((r) => r.json())
      .then((data) => { setSubjects(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.syllabus_code.includes(search)
  )

  const isSelected = (id: string) =>
    selectedSubjects.some((s) => s.subject.id === id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-3xl font-light mb-2" style={{ color: '#F5F5F0' }}>
          Select your subjects
        </h2>
        <p className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
          Choose the subjects you are sitting. You can select multiple.
        </p>
      </div>

      {/* Search with icon */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
        >
          <circle cx="6" cy="6" r="4.5" stroke="#555" strokeWidth="1.2" />
          <path d="M9.5 9.5L12 12" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or syllabus code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-sm rounded-sm border transition-colors duration-150 focus:outline-none"
          style={{
            background: '#141414',
            border: '1px solid #2A2A2A',
            color: '#F5F5F0',
            fontFamily: 'var(--font-sans)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
          onBlur={(e) => (e.target.style.borderColor = '#2A2A2A')}
        />
        {search && (
          <div
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
          >
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Subject grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-sm animate-pulse"
              style={{ background: '#141414' }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((subject, i) => {
              const selected = isSelected(subject.id)
              return (
                <motion.button
                  key={subject.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  onClick={() =>
                    selected ? removeSubject(subject.id) : addSubject(subject)
                  }
                  className="text-left p-5 rounded-sm border transition-all duration-200 cursor-pointer relative overflow-hidden group"
                  style={{
                    background: selected
                      ? 'linear-gradient(135deg, rgba(201,169,110,0.08) 0%, rgba(201,169,110,0.04) 100%)'
                      : '#141414',
                    borderColor: selected ? 'rgba(201,169,110,0.4)' : '#2A2A2A',
                    boxShadow: selected ? '0 0 20px rgba(201,169,110,0.06)' : 'none',
                  }}
                >
                  {/* Large decorative background code */}
                  <div
                    className="absolute -bottom-2 -right-1 font-display text-7xl font-light select-none pointer-events-none leading-none transition-colors duration-300"
                    style={{
                      color: selected ? 'rgba(201,169,110,0.07)' : 'rgba(255,255,255,0.025)',
                    }}
                  >
                    {subject.syllabus_code}
                  </div>

                  <div className="relative">
                    {/* Selected checkmark */}
                    {selected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#C9A96E' }}
                      >
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="#0C0C0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    )}

                    <div
                      className="text-xs mb-2 tracking-wider"
                      style={{
                        color: selected ? '#C9A96E' : '#555',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {subject.syllabus_code}
                    </div>
                    <div
                      className="text-sm font-medium leading-snug"
                      style={{
                        color: selected ? '#F5F5F0' : '#A8A8A8',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {subject.name}
                    </div>
                    {subject.has_tiers && (
                      <div
                        className="text-xs mt-2 tracking-wide"
                        style={{ color: selected ? 'rgba(201,169,110,0.6)' : '#3D3D3D', fontFamily: 'var(--font-sans)' }}
                      >
                        Core · Extended
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Selected count + next */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #1E1E1E' }}>
        <div>
          <span className="text-sm" style={{ color: selectedSubjects.length > 0 ? '#888' : '#555', fontFamily: 'var(--font-sans)' }}>
            {selectedSubjects.length === 0
              ? 'No subjects selected'
              : `${selectedSubjects.length} subject${selectedSubjects.length > 1 ? 's' : ''} selected`}
          </span>
          {selectedSubjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedSubjects.map((ss) => (
                <span
                  key={ss.subject.id}
                  className="text-xs px-2 py-0.5 rounded-sm"
                  style={{
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.2)',
                    color: '#C9A96E',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {ss.subject.syllabus_code}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="primary"
          size="md"
          disabled={selectedSubjects.length === 0}
          onClick={() => setStep(1)}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
