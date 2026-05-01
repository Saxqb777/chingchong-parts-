import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { anthropic, PARTS_SYSTEM_PROMPT } from '@/lib/claude'
import { decodeVin, isValidVin } from '@/lib/vin'

export async function GET(req: NextRequest) {
  const vin = req.nextUrl.searchParams.get('vin')?.trim().toUpperCase()
  if (!vin || vin.length < 5) return NextResponse.json({ error: 'VIN/chassis too short' }, { status: 400 })

  // Decode
  const decoded = decodeVin(vin)

  // Find matching vehicles in DB — match by vinPrefix or brand name
  const matchedVehicles = await prisma.vehicle.findMany({
    where: {
      OR: [
        { vinPrefix: { not: null, startsWith: vin.substring(0, 6) } },
        { vinPrefix: { not: null, startsWith: vin.substring(0, 5) } },
        { vinPrefix: { not: null, startsWith: vin.substring(0, 4) } },
        { vinPrefix: { not: null, startsWith: vin.substring(0, 3) } },
        { chassisCode: vin },
        { brand: { name: { contains: decoded.brand.split('/')[0].trim() } } },
      ],
    },
    include: { brand: true, _count: { select: { parts: true } } },
    take: 5,
  })

  // Get AI explanation
  let aiSummary = ''
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: PARTS_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Decode this VIN/chassis: ${vin}\n\nPreliminary local decode: Brand=${decoded.brand}, WMI=${decoded.wmi}, Year=${decoded.year}, Country=${decoded.country}\n\nExplain in 3-4 sentences what vehicle this likely is and why. Be specific about the WMI, year digit, and what the VDS section suggests about engine/model. Keep it concise and professional.`,
      }],
    })
    aiSummary = msg.content[0].type === 'text' ? msg.content[0].text : ''
  } catch {
    aiSummary = `VIN ${vin} — WMI ${decoded.wmi} identifies this as a ${decoded.manufacturer} vehicle built in ${decoded.country}. Model year from position 10: ${decoded.year || 'undetermined'}. Confidence: ${decoded.confidence}.`
  }

  return NextResponse.json({ vin: decoded, matchedVehicles, aiSummary })
}
