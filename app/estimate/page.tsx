'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { EstimateProvider, useEstimate } from '@/components/estimate/EstimateContext'
import { SubjectSelector } from '@/components/estimate/SubjectSelector'
import { PaperSelector } from '@/components/estimate/PaperSelector'
import { MarkInput } from '@/components/estimate/MarkInput'
import { ReviewStep } from '@/components/estimate/ReviewStep'
import { Stepper } from '@/components/ui'

const STEPS = [
  { label: 'Subjects' },
  { label: 'Papers' },
  { label: 'Marks' },
  { label: 'Review' },
]

function EstimatorContent() {
  const { step } = useEstimate()

  return (
    <main className="min-h-screen" style={{ background: '#0C0C0C' }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-8 py-5"
        style={{ borderBottom: '1px solid #1E1E1E' }}
      >
        <Link href="/" className="font-display text-lg tracking-wide" style={{ color: '#F5F5F0' }}>
          Threshold
        </Link>
        <Link href="/auth/login" className="text-sm" style={{ color: '#888', fontFamily: 'var(--font-sans)' }}>
          Sign in
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Stepper */}
        <div className="mb-10">
          <Stepper steps={STEPS} currentStep={step} />
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 0 && <SubjectSelector />}
            {step === 1 && <PaperSelector />}
            {step === 2 && <MarkInput />}
            {step === 3 && <ReviewStep />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}

export default function EstimatePage() {
  return (
    <EstimateProvider>
      <EstimatorContent />
    </EstimateProvider>
  )
}
