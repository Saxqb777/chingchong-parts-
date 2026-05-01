import { Suspense } from 'react'
import DecodeClient from '@/components/DecodeClient'

export default function DecodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-void pt-14" />}>
      <DecodeClient />
    </Suspense>
  )
}
