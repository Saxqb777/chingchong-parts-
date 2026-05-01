'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Cpu, Search, MessageSquare, LayoutDashboard } from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/decode', label: 'Decode VIN', icon: Search },
  { href: '/chat', label: 'AI Assistant', icon: MessageSquare },
]

export default function Nav() {
  const path = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 glass border-b border-border flex items-center px-6 gap-8">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mr-4">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center glow-blue">
          <Cpu size={14} className="text-white" />
        </div>
        <span className="font-semibold text-sm tracking-wide text-text-primary">
          Sino<span className="text-gradient-blue">Spares</span>
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                ${active
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
            >
              <Icon size={13} />
              {label}
            </Link>
          )
        })}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-jade/30 bg-jade/5">
          <div className="w-1.5 h-1.5 rounded-full bg-jade animate-pulse" />
          <span className="text-xs text-jade font-medium">AI Online</span>
        </div>
        <div className="text-xs text-text-secondary font-mono border border-border px-2 py-1 rounded">
          v1.0
        </div>
      </div>
    </nav>
  )
}
