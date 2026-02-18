'use client'

import React, { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gold text-bg font-medium hover:bg-gold/90 border border-gold',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent',
  outline:
    'bg-transparent text-text-primary border border-border hover:border-gold/50 hover:text-gold',
  danger:
    'bg-transparent text-error border border-error/30 hover:bg-error/10',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs tracking-wide',
  md: 'px-5 py-2.5 text-sm tracking-wide',
  lg: 'px-8 py-3.5 text-base tracking-wider',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        whileHover={isDisabled ? {} : { opacity: 0.9 }}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-sm transition-colors duration-200 cursor-pointer select-none',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ fontFamily: 'var(--font-sans)' }}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
            <span>{children as React.ReactNode}</span>
          </>
        ) : (
          children as React.ReactNode
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
