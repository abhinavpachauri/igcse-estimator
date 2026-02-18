import { NextResponse } from 'next/server'
import { calculateEstimate } from '@/lib/calculation/calculate'
import type { CalculatePayload } from '@/types'

export async function POST(req: Request) {
  let body: CalculatePayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
    return NextResponse.json({ error: 'entries array is required' }, { status: 400 })
  }

  if (body.entries.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 subjects per estimate' }, { status: 400 })
  }

  try {
    const result = await calculateEstimate(body.entries)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[calculate]', err)
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}
