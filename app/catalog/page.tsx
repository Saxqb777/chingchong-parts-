import { prisma } from '@/lib/db'
import CatalogClient from './CatalogClient'

export const dynamic = 'force-dynamic'

export default async function CatalogPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      brand: true,
      _count: { select: { parts: true } },
    },
    orderBy: [{ brand: { name: 'asc' } }, { model: 'asc' }, { year: 'desc' }],
  })

  const brands = await prisma.brand.findMany({
    include: { _count: { select: { vehicles: true } } },
    orderBy: { name: 'asc' },
  })

  return <CatalogClient vehicles={vehicles} brands={brands} />
}
