import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { anthropic, PARTS_SYSTEM_PROMPT } from '@/lib/claude'
import { decodeVin } from '@/lib/vin'
import { lookupVin, ApiPart } from '@/lib/vinapi'

export async function GET(req: NextRequest) {
  const vin = req.nextUrl.searchParams.get('vin')?.trim().toUpperCase()
  if (!vin || vin.length < 5) return NextResponse.json({ error: 'VIN/chassis too short' }, { status: 400 })

  const decoded = decodeVin(vin)

  // ── 1. Try 17vin API for live parts ──────────────────────────────────
  const apiResult = await lookupVin(vin)

  let parts: ApiPart[] = []
  let carInfo = {
    brand:    decoded.brand.split('/')[0].trim(),
    brandZh:  '',
    model:    decoded.brand,
    year:     decoded.year || new Date().getFullYear(),
    fuelType: 'Petrol',
    epc:      '',
    vehicleId: '',
  }

  if (apiResult && apiResult.parts.length > 0) {
    parts = apiResult.parts
    carInfo.brand  = apiResult.brandName
    carInfo.epc    = apiResult.epc

    // Save to DB in background (don't block the response on it)
    saveToDb(vin, decoded, apiResult).then(vid => { if (vid) carInfo.vehicleId = vid }).catch(() => {})
  } else {
    // ── 2. Fallback: load parts from cached DB ────────────────────────
    const vinKey = vin.substring(0, 11)
    const cached = await prisma.vehicle.findFirst({
      where: {
        OR: [
          { vinPrefix: vinKey },
          { vinPrefix: { startsWith: vin.substring(0, 8) } },
          { vinPrefix: { startsWith: vin.substring(0, 6) } },
          { vinPrefix: { startsWith: vin.substring(0, 3) } },
        ],
      },
      include: {
        brand: true,
        parts: { include: { category: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    if (cached && cached.parts.length > 0) {
      carInfo = {
        brand:     cached.brand.name,
        brandZh:   cached.brand.nameZh,
        model:     cached.model,
        year:      cached.year,
        fuelType:  cached.fuelType,
        epc:       '',
        vehicleId: cached.id,
      }
      parts = cached.parts.map(p => ({
        name:       p.name,
        nameZh:     p.nameZh || '',
        oemNumber:  p.oemNumber,
        category:   p.category.name,
        categoryZh: p.category.nameZh,
        matched:    false,
      }))
    }
  }

  // ── 3. AI summary ─────────────────────────────────────────────────────
  let aiSummary = ''
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      system: 'You identify Chinese vehicles from VIN data. Reply in plain text only — no markdown, no bold, no asterisks. One sentence maximum.',
      messages: [{
        role: 'user',
        content: `VIN: ${vin}. WMI=${decoded.wmi}, year digit=${decoded.year}, country=${decoded.country}. What vehicle is this and what year?`,
      }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    aiSummary = raw.replace(/\*\*/g, '').replace(/\*/g, '').trim()
  } catch {
    aiSummary = `WMI ${decoded.wmi} — ${decoded.manufacturer}, ${decoded.country}. Year: ${decoded.year || 'unknown'}.`
  }

  return NextResponse.json({ vin: decoded, carInfo, parts, aiSummary })
}

async function saveToDb(
  vin: string,
  decoded: ReturnType<typeof decodeVin>,
  apiResult: NonNullable<Awaited<ReturnType<typeof lookupVin>>>
): Promise<string> {
  const brand = await prisma.brand.upsert({
    where: { name: apiResult.brandName },
    update: {},
    create: { name: apiResult.brandName, nameZh: '', country: decoded.country },
  })

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
        name:       part.name,
        nameZh:     part.nameZh || null,
        oemNumber:  part.oemNumber,
        vehicleId:  vehicle.id,
        categoryId: cat.id,
      },
    })
  }

  return vehicle.id
}
