'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  suffix?: string
  prefix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, suffix, prefix, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs text-text-secondary tracking-wider uppercase"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-text-tertiary text-sm select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full bg-surface border rounded-sm text-text-primary placeholder-text-tertiary',
              'px-3 py-2.5 text-sm transition-colors duration-150',
              'focus:outline-none focus:border-gold/50 focus:bg-surface-elevated',
              'hover:border-border hover:bg-surface-elevated',
              error ? 'border-error/50' : 'border-border',
              prefix ? 'pl-8' : '',
              suffix ? 'pr-16' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ fontFamily: 'var(--font-sans)' }}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-text-tertiary text-xs select-none">
              {suffix}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-xs text-error">{error}</p>
        ) : hint ? (
          <p className="text-xs text-text-tertiary">{hint}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
