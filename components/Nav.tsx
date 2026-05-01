'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageSquare, LayoutGrid } from 'lucide-react'

const links = [
  { href: '/', label: 'Overview', icon: LayoutGrid },
  { href: '/decode', label: 'VIN Decode', icon: Search },
  { href: '/chat', label: 'AI Search', icon: MessageSquare },
]

export default function Nav() {
  const path = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-13 glass flex items-center px-6 gap-8" style={{ height: '52px' }}>
      {/* Wordmark */}
      <Link href="/" className="flex items-center gap-2 mr-6 shrink-0">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="1" y="1" width="8" height="8" rx="2" fill="#4f7dff" fillOpacity="0.9"/>
          <rect x="11" y="1" width="8" height="8" rx="2" fill="#4f7dff" fillOpacity="0.4"/>
          <rect x="1" y="11" width="8" height="8" rx="2" fill="#4f7dff" fillOpacity="0.4"/>
          <rect x="11" y="11" width="8" height="8" rx="2" fill="#00d4a0" fillOpacity="0.7"/>
        </svg>
        <span className="text-sm font-semibold tracking-tight">
          <span className="text-text-primary">Sino</span><span className="text-gradient-blue">Spares</span>
        </span>
      </Link>

      {/* Nav */}
      <div className="flex items-center gap-0.5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${active
                  ? 'text-[#8aafff] bg-[rgba(79,125,255,0.1)]'
                  : 'text-[#525270] hover:text-[#8a8ab0] hover:bg-[rgba(255,255,255,0.03)]'
                }`}>
              <Icon size={12} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00d4a0]" style={{ boxShadow: '0 0 6px #00d4a0' }} />
          <span className="text-xs text-[#525270]">AI live</span>
        </div>
        <div className="h-4 w-px bg-[#18182a]" />
        <span className="text-xs font-mono text-[#2a2a45]">v1.0</span>
      </div>
    </nav>
  )
}
