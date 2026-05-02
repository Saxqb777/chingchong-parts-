import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'SinoSpares — Chinese Auto Parts Intelligence',
  description: 'Professional Chinese vehicle parts identification. VIN decode, OEM numbers, AI search.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        <main style={{ paddingTop: 52 }}>{children}</main>
      </body>
    </html>
  )
}
