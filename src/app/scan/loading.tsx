/**
 * Scan page loading skeleton — rendered automatically by the Next.js App
 * Router while `/scan` and its data dependencies are loading.
 *
 * Displays animated `animate-pulse` placeholder blocks that mirror the
 * rough layout of the `ScanPage` heading, subtitle, and `ScanForm` card,
 * preventing layout shift when the real content hydrates.
 *
 * No props or data fetching — this component is always a pure skeleton.
 */
export default function ScanLoading() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="bg-aged mb-2 h-12 w-64 animate-pulse rounded opacity-60" />
      <div className="bg-aged mb-8 h-4 w-80 animate-pulse rounded opacity-40" />
      <div className="border-tag-edge bg-manila animate-pulse rounded-xl border-2 p-8">
        <div className="bg-aged mb-4 h-4 w-48 rounded opacity-50" />
        <div className="bg-aged mb-3 h-10 w-full rounded opacity-40" />
        <div className="bg-aged h-10 w-full rounded opacity-30" />
      </div>
    </main>
  )
}
