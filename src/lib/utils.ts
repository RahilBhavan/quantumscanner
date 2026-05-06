import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS class names with conflict resolution.
 *
 * Combines `clsx` (conditional class joining) with `tailwind-merge` (smart
 * deduplication of conflicting Tailwind utilities). This ensures that later
 * classes win over earlier ones for the same CSS property — for example,
 * `cn('text-red-500', 'text-blue-500')` correctly produces `'text-blue-500'`
 * rather than including both.
 *
 * @param inputs - Any number of class values: strings, arrays, objects, or
 *   conditionals accepted by `clsx`.
 * @returns A single merged class string safe to pass to `className`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
