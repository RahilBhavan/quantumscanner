'use client'

export default function ScanError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h2 className="text-xl font-semibold text-destructive mb-2">
        Something went wrong
      </h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="text-sm underline"
      >
        Try again
      </button>
    </main>
  )
}
