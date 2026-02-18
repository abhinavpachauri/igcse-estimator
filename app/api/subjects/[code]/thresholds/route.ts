import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { averageThresholds } from '@/lib/calculation/average-thresholds'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { searchParams } = new URL(req.url)
  const tier = searchParams.get('tier') as 'Core' | 'Extended' | null

  const supabase = await createClient()

  const { data: subject, error } = await supabase
    .from('subjects')
    .select('id')
    .eq('syllabus_code', code)
    .single()

  if (error || !subject) {
    return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
  }

  const thresholds = await averageThresholds(supabase, subject.id, tier)

  return NextResponse.json(thresholds)
}
