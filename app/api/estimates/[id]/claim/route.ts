import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/estimates/[id]/claim
 * Called after signup to transfer a guest session's estimates to the new account.
 * Body: { session_id: string }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { session_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.session_id) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  // Transfer all guest estimates for this session to the authenticated user
  const { error } = await supabase
    .from('saved_estimates')
    .update({ user_id: user.id, session_id: null })
    .eq('session_id', body.session_id)
    .is('user_id', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
