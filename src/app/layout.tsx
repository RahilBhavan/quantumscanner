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
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link
              href="/"
              className="text-ink-dark hover:text-ink-mid flex items-center gap-2 transition-colors"
            >
              <Tag className="h-5 w-5" />
              <span className="font-stamp text-xl leading-none">
                Quantum Scanner
              </span>
            </Link>
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-0">
                {NAV_LINKS.map((link, i) => (
                  <li key={link.href} className="flex items-center">
                    {i > 0 && (
                      <span
                        className="text-ink-faint font-form px-1 text-sm select-none"
                        aria-hidden="true"
                      >
                        ·
                      </span>
                    )}
                    <Link
                      href={link.href}
                      className="font-stamp text-ink-mid hover:text-ink-dark px-2 py-1 text-sm transition-colors"
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
