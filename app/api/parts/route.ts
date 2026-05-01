import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const vehicleId = req.nextUrl.searchParams.get('vehicleId')
  const categoryId = req.nextUrl.searchParams.get('categoryId')
  const q = req.nextUrl.searchParams.get('q')

  if (vehicleId) {
    const parts = await prisma.part.findMany({
      where: {
        vehicleId,
        ...(categoryId ? { categoryId } : {}),
        ...(q ? {
          OR: [
            { name: { contains: q } },
            { oemNumber: { contains: q } },
            { nameZh: { contains: q } },
          ],
        } : {}),
      },
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    })
    return NextResponse.json(parts)
  }

  if (q) {
    const parts = await prisma.part.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { oemNumber: { contains: q } },
          { nameZh: { contains: q } },
          { description: { contains: q } },
        ],
      },
      include: { category: true, vehicle: { include: { brand: true } } },
      take: 20,
    })
    return NextResponse.json(parts)
  }

  return NextResponse.json({ error: 'Provide vehicleId or q param' }, { status: 400 })
}
