import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const supabase = await createClient()

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('id, syllabus_code, name, has_tiers')
    .eq('syllabus_code', code)
    .single()

  if (subjectError || !subject) {
    return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
  }

  const { data: papers, error: papersError } = await supabase
    .from('papers')
    .select(
      'id, paper_number, name, tier, is_ums, max_raw_mark, max_ums_mark, weight_percentage'
    )
    .eq('subject_id', subject.id)
    .order('paper_number')

  if (papersError) {
    return NextResponse.json({ error: papersError.message }, { status: 500 })
  }

  return NextResponse.json({ ...subject, papers })
}
