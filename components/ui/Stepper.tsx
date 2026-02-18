'use client'

import { motion } from 'framer-motion'

interface Step {
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className = '' }: StepperProps) {
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{
                    backgroundColor: isCompleted
                      ? '#C9A96E'
                      : isActive
                      ? 'transparent'
                      : 'transparent',
                    borderColor: isCompleted
                      ? '#C9A96E'
                      : isActive
                      ? '#C9A96E'
                      : '#2A2A2A',
                  }}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors duration-300"
                >
                  {isCompleted ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="#0C0C0C"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <motion.span
                      animate={{ color: isActive ? '#C9A96E' : '#555555' }}
                      className="text-xs font-medium"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      {index + 1}
                    </motion.span>
                  )}
                </motion.div>
              </div>

              <span
                className="text-xs whitespace-nowrap hidden sm:block"
                style={{
                  color: isActive
                    ? '#F5F5F0'
                    : isCompleted
                    ? '#C9A96E'
                    : '#555555',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-3 mb-5">
                <div className="h-px bg-border relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gold/50"
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
