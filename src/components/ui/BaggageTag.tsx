import { cn } from '@/lib/utils'

/**
 * Visual severity variant for a baggage tag.
 * Maps to distinct background, ink, and border colour sets defined in
 * {@link VARIANT_STYLES}.
 *
 * | Variant   | Semantic meaning                        |
 * |-----------|-----------------------------------------|
 * | safe      | Address is safe at rest                 |
 * | exposed   | Address public key is on-chain exposed  |
 * | empty     | Address has no UTXO balance             |
 * | error     | Address is unresolvable / error state   |
 * | neutral   | Generic / informational use             |
 */
export type TagVariant = 'safe' | 'exposed' | 'empty' | 'error' | 'neutral'

/**
 * Controls the maximum width of the tag card and the font size of the
 * destination heading.
 *
 * | Size | Max width | Destination text |
 * |------|-----------|-----------------|
 * | sm   | max-w-xs  | text-3xl        |
 * | md   | max-w-sm  | text-5xl        |
 * | lg   | max-w-lg  | text-7xl        |
 */
export type TagSize = 'sm' | 'md' | 'lg'

/** Props for {@link BaggageTag}. */
interface BaggageTagProps {
  /**
   * Colour scheme of the tag. Drives background, border, and ink colours.
   * Defaults to `'neutral'`.
   */
  variant?: TagVariant
  /**
   * Large heading text rendered in the tag header — analogous to the
   * destination city printed on a physical luggage label.
   */
  destination: string
  /**
   * Smaller secondary label rendered beneath `destination` in the header,
   * e.g. `"Safe at Rest"` or `"Quantum Risk"`.
   */
  subLabel?: string
  /**
   * Optional rotated stamp text overlaid in the top-right corner of the
   * header, e.g. `"Priority"`. Rendered with `aria-hidden` since it is
   * purely decorative.
   */
  badge?: string
  /**
   * Whether to render the thin vertical line above the hole that simulates
   * the string used to attach a physical baggage tag. Defaults to `true`.
   */
  showString?: boolean
  /**
   * Whether to render the circular punch hole at the top of the card.
   * Defaults to `true`.
   */
  showHole?: boolean
  /** Size variant controlling card width and heading scale. Defaults to `'md'`. */
  size?: TagSize
  /** Additional Tailwind classes applied to the outermost wrapper element. */
  className?: string
  /** Content rendered in the padded body area below the tag header. */
  children?: React.ReactNode
}

/**
 * Per-variant Tailwind class bundles for background, text ink, and border.
 * Centralised here so all four card components derive from the same source
 * of truth.
 */
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

/**
 * Per-size Tailwind class bundles for container max-width, destination heading
 * font size, and inner padding.
 */
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

/**
 * Hex colour values corresponding to each {@link TagVariant}.
 *
 * Used wherever a raw hex string is required instead of a Tailwind class —
 * primarily as `fill` props on Recharts `<Bar>` elements in
 * {@link ExposureChart}.
 */
export const TAG_COLORS: Record<TagVariant, string> = {
  safe: '#3D5E38',
  exposed: '#7A3028',
  empty: '#3A5162',
  error: '#7A6012',
  neutral: '#5C4F3A',
}

/**
 * Core design-system primitive that renders a vintage airline baggage tag.
 *
 * All four scan-result cards ({@link SafeAtRestCard}, {@link ExposedCard},
 * {@link EmptyCard}, {@link UnresolvableCard}) are built on top of this
 * component. The tag anatomy consists of:
 *
 * 1. **String** — a thin vertical line (decorative, `aria-hidden`).
 * 2. **Hole** — a circular punch mark at the top, overlapping the card edge.
 * 3. **Header** — contains the large `destination` text, optional `subLabel`,
 *    and an optional rotated `badge` stamp.
 * 4. **Body** — padded area for arbitrary `children` content.
 *
 * Colour theming is driven by the `variant` prop via {@link VARIANT_STYLES};
 * card dimensions are controlled by `size` via {@link SIZE_STYLES}.
 */
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
        <div aria-hidden="true" className="relative z-10 -mb-2.5">
          <div className="bg-parchment border-tag-hole h-5 w-5 rounded-full border-2 shadow-inner" />
        </div>
      )}

      <div
        className={cn(
          'shadow-tag overflow-hidden rounded-xl border-2',
          v.bg,
          v.border,
          s.container
        )}
      >
        {/* Destination header */}
        <div
          className={cn(
            'border-tag-edge/50 relative border-b-2 border-dashed',
            s.padding,
            showHole && 'pt-5'
          )}
        >
          <div className={cn('font-stamp leading-none', v.ink, s.destination)}>
            {destination}
          </div>
          {subLabel && (
            <div className="font-form mt-1 text-xs tracking-[0.2em] uppercase opacity-60">
              {subLabel}
            </div>
          )}
          {badge && (
            <span
              aria-hidden="true"
              className="font-stamp border-stamp-red text-stamp-red absolute top-3 right-3 -rotate-12 border-2 px-1.5 py-0.5 text-xs tracking-widest opacity-85"
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
