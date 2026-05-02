'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const links = [
  { href: '/',       label: 'Overview'   },
  { href: '/decode', label: 'VIN Decode' },
  { href: '/chat',   label: 'AI Search'  },
]

export default function Nav() {
  const path = usePathname()
  const [partCount, setPartCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/parts-count').then(r => r.json()).then(d => setPartCount(d.count)).catch(() => {})
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-8 gap-10 bg-paper border-b border-paper-edge"
      style={{ height: 52 }}
    >
      {/* Seal + wordmark */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="seal">配</div>
        <div>
          <span className="text-sm font-semibold text-ink tracking-tight">SinoSpares</span>
          <span className="text-ink-mute text-xs ml-1.5 hidden sm:inline font-cjk">零件</span>
        </div>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-7 h-full">
        {links.map(({ href, label }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link key={href} href={href} className={`nav-link ${active ? 'active' : ''}`}>
              {label}
            </Link>
          )
        })}
      </div>

      {/* Useful metadata — not branding */}
      <div className="ml-auto font-mono text-2xs text-ink-mute tracking-wide hidden md:block">
        {partCount !== null
          ? `配件库 · ${partCount.toLocaleString()} parts`
          : '配件库 · —'}
      </div>
    </nav>
  )
}
