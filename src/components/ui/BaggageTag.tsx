import { cn } from '@/lib/utils'

export type TagVariant = 'safe' | 'exposed' | 'empty' | 'error' | 'neutral'
export type TagSize = 'sm' | 'md' | 'lg'

interface BaggageTagProps {
  variant?: TagVariant
  destination: string
  subLabel?: string
  badge?: string
  showString?: boolean
  showHole?: boolean
  size?: TagSize
  className?: string
  children?: React.ReactNode
}

const VARIANT_STYLES: Record<
  TagVariant,
  { bg: string; ink: string; border: string }
> = {
  safe: {
    bg: 'bg-tag-safe-bg',
    ink: 'text-tag-safe',
    border: 'border-tag-safe/50',
  },
  exposed: {
    bg: 'bg-tag-exposed-bg',
    ink: 'text-tag-exposed',
    border: 'border-tag-exposed/50',
  },
  empty: {
    bg: 'bg-tag-empty-bg',
    ink: 'text-tag-empty',
    border: 'border-tag-empty/50',
  },
  error: {
    bg: 'bg-tag-error-bg',
    ink: 'text-tag-error',
    border: 'border-tag-error/50',
  },
  neutral: {
    bg: 'bg-manila',
    ink: 'text-ink-dark',
    border: 'border-tag-edge',
  },
}

const SIZE_STYLES: Record<
  TagSize,
  { container: string; destination: string; padding: string }
> = {
  sm: {
    container: 'max-w-xs w-full',
    destination: 'text-3xl',
    padding: 'px-4 py-3',
  },
  md: {
    container: 'max-w-sm w-full',
    destination: 'text-5xl',
    padding: 'px-5 py-4',
  },
  lg: {
    container: 'max-w-lg w-full',
    destination: 'text-7xl',
    padding: 'px-6 py-5',
  },
}

/** Hex values for use in SVG fill props (e.g. Recharts) */
export const TAG_COLORS: Record<TagVariant, string> = {
  safe: '#3D5E38',
  exposed: '#7A3028',
  empty: '#3A5162',
  error: '#7A6012',
  neutral: '#5C4F3A',
}

export function BaggageTag({
  variant = 'neutral',
  destination,
  subLabel,
  badge,
  showString = true,
  showHole = true,
  size = 'md',
  className,
  children,
}: BaggageTagProps) {
  const v = VARIANT_STYLES[variant]
  const s = SIZE_STYLES[size]

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {showString && (
        <div
          aria-hidden="true"
          className="w-px bg-[var(--tag-string)] opacity-60"
          style={{ height: '28px' }}
        />
      )}

      {showHole && (
        <div
          aria-hidden="true"
          className="relative z-10 -mb-2.5"
        >
          <div
            className="w-5 h-5 rounded-full bg-parchment border-2 border-tag-hole shadow-inner"
          />
        </div>
      )}

      <div
        className={cn(
          'rounded-xl border-2 shadow-tag overflow-hidden',
          v.bg,
          v.border,
          s.container
        )}
      >
        {/* Destination header */}
        <div
          className={cn(
            'relative border-b-2 border-dashed border-tag-edge/50',
            s.padding,
            showHole && 'pt-5'
          )}
        >
          <div className={cn('font-stamp leading-none', v.ink, s.destination)}>
            {destination}
          </div>
          {subLabel && (
            <div className="font-form text-xs tracking-[0.2em] uppercase mt-1 opacity-60">
              {subLabel}
            </div>
          )}
          {badge && (
            <span
              aria-hidden="true"
              className="absolute top-3 right-3 font-stamp text-xs border-2 border-stamp-red text-stamp-red px-1.5 py-0.5 tracking-widest -rotate-12 opacity-85"
            >
              {badge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className={s.padding}>{children}</div>
      </div>
    </div>
  )
}
