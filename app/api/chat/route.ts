import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { anthropic, PARTS_SYSTEM_PROMPT } from '@/lib/claude'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

  const lastUserMsg = messages[messages.length - 1]?.content || ''

  // Try to find relevant parts in DB to give AI context
  let dbContext = ''
  try {
    const words = lastUserMsg.split(/\s+/).filter((w: string) => w.length > 3)
    if (words.length > 0) {
      const parts = await prisma.part.findMany({
        where: {
          OR: [
            { name: { contains: words[0] } },
            { oemNumber: { contains: lastUserMsg.toUpperCase().replace(/\s/g, '') } },
            { vehicle: { model: { contains: words[0] } } },
            { vehicle: { brand: { name: { contains: words[0] } } } },
          ],
        },
        include: { vehicle: { include: { brand: true } }, category: true },
        take: 8,
      })

      if (parts.length > 0) {
        dbContext = '\n\n[CATALOG DATA FOUND]\n' + parts.map(p =>
          `- ${p.vehicle.brand.name} ${p.vehicle.model} (${p.vehicle.year}) | ${p.category.name} | ${p.name} | OEM: ${p.oemNumber}${p.altNumbers ? ` | Alt: ${p.altNumbers}` : ''}${p.description ? ` | ${p.description}` : ''}`
        ).join('\n')
      }
    }
  } catch { /* DB search optional */ }

  const systemWithContext = PARTS_SYSTEM_PROMPT + dbContext

  // Stream response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemWithContext,
          messages: messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        })

        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const data = JSON.stringify({ delta: { text: event.delta.text } })
            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
          }
        }

        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
