import { Grade } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'gold' | 'grade' | 'subtle'
  grade?: Grade
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const gradeStyles: Record<Grade, string> = {
  'A*': 'bg-[#C9A96E20] text-gold border-gold/30',
  'A':  'bg-[#B8C9A920] text-[#B8C9A9] border-[#B8C9A9]/30',
  'B':  'bg-[#A9B8C920] text-[#A9B8C9] border-[#A9B8C9]/30',
  'C':  'bg-[#C9B8A920] text-[#C9B8A9] border-[#C9B8A9]/30',
  'D':  'bg-[#88888820] text-platinum border-platinum/30',
  'E':  'bg-[#55555520] text-text-secondary border-border',
  'F':  'bg-[#55555520] text-text-secondary border-border',
  'G':  'bg-[#55555520] text-text-secondary border-border',
  'U':  'bg-[#CF667920] text-error border-error/30',
}

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
}

export function Badge({
  children,
  variant = 'default',
  grade,
  size = 'md',
  className = '',
}: BadgeProps) {
  const base = 'inline-flex items-center rounded-sm border font-medium tracking-wide'

  let variantClass = ''
  if (variant === 'grade' && grade) {
    variantClass = gradeStyles[grade]
  } else if (variant === 'gold') {
    variantClass = 'bg-gold/10 text-gold border-gold/20'
  } else if (variant === 'subtle') {
    variantClass = 'bg-surface-elevated text-text-secondary border-border'
  } else {
    variantClass = 'bg-surface text-text-primary border-border'
  }

  return (
    <span
      className={[base, variantClass, sizes[size], className]
        .filter(Boolean)
        .join(' ')}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {children}
    </span>
  )
}

// Large grade display for results
export function GradeBadge({ grade }: { grade: Grade | null }) {
  if (!grade) return null

  return (
    <div
      className={[
        'inline-flex items-center justify-center w-16 h-16 rounded-sm border-2 font-display text-3xl font-light',
        grade === 'A*'
          ? 'border-gold text-gold bg-gold/5'
          : grade === 'A'
          ? 'border-[#B8C9A9] text-[#B8C9A9] bg-[#B8C9A9]/5'
          : grade === 'B'
          ? 'border-[#A9B8C9] text-[#A9B8C9] bg-[#A9B8C9]/5'
          : grade === 'C'
          ? 'border-[#C9B8A9] text-[#C9B8A9] bg-[#C9B8A9]/5'
          : 'border-border text-text-secondary bg-surface',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {grade}
    </div>
  )
}
