'use client'

/**
 * Scan page error boundary — rendered automatically by the Next.js App Router
 * when an unhandled error is thrown within the `/scan` route segment.
 *
 * Displays a user-friendly error message and a "Try again" button that calls
 * the `reset` function provided by the App Router to attempt re-rendering the
 * failed segment. Must be a Client Component so it can use the interactive
 * `reset` callback.
 *
 * @param error - The `Error` object caught by the error boundary.
 * @param reset - App Router callback that triggers a re-render attempt of the
 *   erroring segment, equivalent to retrying the navigation.
 */
export default function ScanError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h2 className="font-stamp text-stamp-red mb-2 text-4xl">
        Something went wrong
      </h2>
      <p className="font-form text-ink-mid mb-6 text-sm">
        An error occurred loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="font-stamp border-tag-edge text-ink-mid hover:text-ink-dark rounded-lg border-2 border-dashed px-4 py-2 text-xs tracking-wider transition-colors"
      >
        Try again
      </button>
    </main>
  )
}
