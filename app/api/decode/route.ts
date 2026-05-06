import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { anthropic, PARTS_SYSTEM_PROMPT } from '@/lib/claude'
import { decodeVin } from '@/lib/vin'
import { lookupVin } from '@/lib/vinapi'

export async function GET(req: NextRequest) {
  const vin = req.nextUrl.searchParams.get('vin')?.trim().toUpperCase()
  if (!vin || vin.length < 5) return NextResponse.json({ error: 'VIN/chassis too short' }, { status: 400 })

  const decoded = decodeVin(vin)

  // ── 1. Try 17vin API for real live parts data ─────────────────────────
  const apiResult = await lookupVin(vin)

  let matchedVehicles: Array<{
    id: string; model: string; year: number; engine: string | null
    fuelType: string; bodyType: string | null
    brand: { name: string; nameZh: string }
    _count: { parts: number }
  }> = []

  if (apiResult && apiResult.parts.length > 0) {
    const brandName = apiResult.brandName || decoded.brand.split('/')[0].trim()
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName, nameZh: '', country: decoded.country },
    })

    // Key vehicles by first 11 chars of VIN (WMI + VDS)
    const vinKey = vin.substring(0, 11)
    const vehicle = await prisma.vehicle.upsert({
      where: { vinPrefix: vinKey },
      update: { updatedAt: new Date() },
      create: {
        model:     decoded.brand,
        year:      decoded.year || new Date().getFullYear(),
        fuelType:  'Petrol',
        vinPrefix: vinKey,
        brandId:   brand.id,
      },
    })

    for (const part of apiResult.parts) {
      if (!part.oemNumber) continue
      const cat = await prisma.partCategory.upsert({
        where: { name: part.category },
        update: {},
        create: { name: part.category, nameZh: part.categoryZh || part.category, icon: 'box' },
      })
      await prisma.part.upsert({
        where: { oemNumber: part.oemNumber },
        update: { name: part.name, nameZh: part.nameZh || null, categoryId: cat.id },
        create: {
          name:      part.name,
          nameZh:    part.nameZh || null,
          oemNumber: part.oemNumber,
          vehicleId: vehicle.id,
          categoryId: cat.id,
        },
      })
    }

    matchedVehicles = [{
      id:       vehicle.id,
      model:    vehicle.model,
      year:     vehicle.year,
      engine:   vehicle.engine,
      fuelType: vehicle.fuelType,
      bodyType: vehicle.bodyType,
      brand:    { name: brand.name, nameZh: brand.nameZh },
      _count:   { parts: apiResult.parts.length },
    }]
  } else {
    // ── 2. Fallback: search existing cached DB ────────────────────────
    matchedVehicles = await prisma.vehicle.findMany({
      where: {
        OR: [
          { vinPrefix: { not: null, startsWith: vin.substring(0, 6) } },
          { vinPrefix: { not: null, startsWith: vin.substring(0, 5) } },
          { vinPrefix: { not: null, startsWith: vin.substring(0, 4) } },
          { vinPrefix: { not: null, startsWith: vin.substring(0, 3) } },
          { brand: { name: { contains: decoded.brand.split('/')[0].trim() } } },
        ],
      },
      include: { brand: true, _count: { select: { parts: true } } },
      take: 5,
    })
  }

  // ── 3. AI summary ─────────────────────────────────────────────────────
  let aiSummary = ''
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: PARTS_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Decode this VIN: ${vin}\nPreliminary decode: Brand=${decoded.brand}, WMI=${decoded.wmi}, Year=${decoded.year}, Country=${decoded.country}\nExplain in 3-4 sentences what vehicle this likely is. Be specific about WMI, year digit, and VDS section. Keep it concise.`,
      }],
    })
    aiSummary = msg.content[0].type === 'text' ? msg.content[0].text : ''
  } catch {
    aiSummary = `VIN ${vin} — WMI ${decoded.wmi} identifies this as a ${decoded.manufacturer} vehicle built in ${decoded.country}. Model year: ${decoded.year || 'undetermined'}. Confidence: ${decoded.confidence}.`
  }

  return NextResponse.json({ vin: decoded, matchedVehicles, aiSummary })
}
