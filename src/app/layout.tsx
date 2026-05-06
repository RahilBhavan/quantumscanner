import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Bitcoin Quantum Exposure Scanner',
  description: 'Check your Bitcoin addresses for quantum computer vulnerability.',
}

const NAV_LINKS = [
  { href: '/scan', label: 'Scan' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/about', label: 'About' },
]

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Shield className="h-5 w-5 text-primary" />
              <span>QuantumScanner</span>
            </Link>
            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-1">
                {NAV_LINKS.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          <p>
            MIT License · Open source on{' '}
            <a
              href="https://github.com/rahil1206/quantum-scanner"
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>{' '}
            · No personal data stored ·{' '}
            <Link href="/methodology" className="hover:underline">
              Methodology
            </Link>
          </p>
        </footer>
      </body>
    </html>
  )
}
