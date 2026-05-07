import type { Metadata } from 'next'
import { Bebas_Neue, Courier_Prime } from 'next/font/google'
import Link from 'next/link'
import { Tag } from 'lucide-react'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas-neue',
  subsets: ['latin'],
})

const courierPrime = Courier_Prime({
  weight: ['400', '700'],
  variable: '--font-courier-prime',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Bitcoin Quantum Exposure Scanner',
  description:
    'Check your Bitcoin addresses for quantum computer vulnerability.',
}

const NAV_LINKS = [
  { href: '/scan', label: 'Scan' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/about', label: 'About' },
]

/**
 * Root layout — wraps every route in the application.
 *
 * Injects the two global Google Fonts as CSS custom properties and applies the
 * base `bg-parchment` page background. Renders the persistent sticky header
 * with main navigation and the site-wide footer.
 *
 * ### Fonts
 * - `--font-bebas-neue` → `font-stamp` utility class — used for headings,
 *   labels, and display text throughout the baggage-tag design system.
 * - `--font-courier-prime` → `font-form` utility class — used for body copy,
 *   form labels, and data values.
 *
 * ### Header
 * A sticky top bar (z-index 40) containing the brand logo link (`/`) and the
 * primary navigation: Scan · Portfolio · Methodology · About.
 *
 * ### Footer
 * Centred footer with MIT licence notice, GitHub link, privacy statement, and
 * a link to `/methodology`.
 *
 * @param children - The active page or layout subtree rendered by the
 *   Next.js App Router.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${courierPrime.variable} h-full`}
    >
      <body className="bg-parchment flex min-h-full flex-col">
        <header className="border-tag-edge bg-aged sticky top-0 z-40 border-b-2">
          <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-y-1 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
            <Link
              href="/"
              className="text-ink-dark hover:text-ink-mid flex items-center gap-2 transition-colors"
            >
              <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-stamp text-lg leading-none sm:text-xl">
                Quantum Scanner
              </span>
            </Link>
            <nav aria-label="Main navigation">
              <ul className="flex flex-wrap items-center gap-0">
                {NAV_LINKS.map((link, i) => (
                  <li key={link.href} className="flex items-center">
                    {i > 0 && (
                      <span
                        className="text-ink-faint font-form px-0.5 text-xs select-none sm:px-1 sm:text-sm"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                    )}
                    <Link
                      href={link.href}
                      className="font-stamp text-ink-mid hover:text-ink-dark px-1.5 py-1 text-xs transition-colors sm:px-2 sm:text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <div className="flex flex-1 flex-col">{children}</div>

        <footer className="bg-aged perforation py-5 text-center">
          <p className="font-form text-ink-faint text-xs tracking-widest uppercase">
            MIT License <span aria-hidden="true">·</span> Open source on{' '}
            <a
              href="https://github.com/rahil1206/quantum-scanner"
              className="text-ink-mid hover:text-ink-dark underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{' '}
            <span aria-hidden="true">·</span> No personal data stored{' '}
            <span aria-hidden="true">·</span>{' '}
            <Link
              href="/methodology"
              className="text-ink-mid hover:text-ink-dark underline transition-colors"
            >
              Methodology
            </Link>
          </p>
        </footer>
      </body>
    </html>
  )
}
