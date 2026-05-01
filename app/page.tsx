import { prisma } from '@/lib/db'
import HomeClient from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [brands, recentVehicles, partCount] = await Promise.all([
    prisma.brand.findMany({ include: { _count: { select: { vehicles: true } } }, orderBy: { name: 'asc' } }),
    prisma.vehicle.findMany({
      take: 6,
      include: { brand: true, _count: { select: { parts: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.part.count(),
  ])

  return <HomeClient brands={brands} recentVehicles={recentVehicles} partCount={partCount} />
}
