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

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by subject name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 text-sm rounded-sm border transition-colors duration-150 focus:outline-none"
          style={{
            background: '#141414',
            border: '1px solid #2A2A2A',
            color: '#F5F5F0',
            fontFamily: 'var(--font-sans)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(201,169,110,0.5)')}
          onBlur={(e) => (e.target.style.borderColor = '#2A2A2A')}
        />
      </div>

      {/* Subject grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-sm animate-pulse"
              style={{ background: '#141414' }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((subject, i) => {
            const selected = isSelected(subject.id)
            return (
              <motion.button
                key={subject.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() =>
                  selected ? removeSubject(subject.id) : addSubject(subject)
                }
                className="text-left p-4 rounded-sm border transition-all duration-200 cursor-pointer"
                style={{
                  background: selected ? 'rgba(201,169,110,0.05)' : '#141414',
                  borderColor: selected ? 'rgba(201,169,110,0.4)' : '#2A2A2A',
                }}
              >
                <div
                  className="text-xs mb-1.5 tracking-wider"
                  style={{ color: selected ? '#C9A96E' : '#555', fontFamily: 'var(--font-sans)' }}
                >
                  {subject.syllabus_code}
                </div>
                <div
                  className="text-sm font-medium leading-snug"
                  style={{ color: selected ? '#F5F5F0' : '#A8A8A8', fontFamily: 'var(--font-sans)' }}
                >
                  {subject.name}
                </div>
                {subject.has_tiers && (
                  <div
                    className="text-xs mt-1"
                    style={{ color: '#555', fontFamily: 'var(--font-sans)' }}
                  >
                    Core / Extended
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Selected count + next */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #1E1E1E' }}>
        <span className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
          {selectedSubjects.length === 0
            ? 'No subjects selected'
            : `${selectedSubjects.length} subject${selectedSubjects.length > 1 ? 's' : ''} selected`}
        </span>
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
