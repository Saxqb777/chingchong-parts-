import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import ChatClient from '@/components/ChatClient'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
  const [brands, vehicles] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: 'asc' } }),
    prisma.vehicle.findMany({
      select: { id: true, model: true, year: true, brandId: true, brand: { select: { id: true, name: true } } },
      orderBy: [{ brand: { name: 'asc' } }, { model: 'asc' }, { year: 'desc' }],
    }),
  ])

  return (
    <Suspense fallback={<div className="min-h-screen bg-paper pt-14" />}>
      <ChatClient brands={brands} vehicles={vehicles} />
    </Suspense>
  )
}
