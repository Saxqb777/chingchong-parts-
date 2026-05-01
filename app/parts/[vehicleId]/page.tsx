import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import PartsClient from '@/components/PartsClient'

export default async function PartsPage({ params }: { params: { vehicleId: string } }) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.vehicleId },
    include: {
      brand: true,
      parts: { include: { category: true }, orderBy: { name: 'asc' } },
    },
  })

  if (!vehicle) notFound()

  const categories = await prisma.partCategory.findMany({ orderBy: { name: 'asc' } })

  return <PartsClient vehicle={vehicle as Parameters<typeof PartsClient>[0]['vehicle']} categories={categories} />
}
