import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client — service role bypasses email confirmation
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  // Create user with email pre-confirmed so they can sign in immediately
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name ?? email.split('@')[0] },
  })

  if (error) {
    // Surface a friendly message for the most common case
    const message =
      error.message.includes('already been registered') || error.message.includes('already exists')
        ? 'An account with this email already exists. Try signing in instead.'
        : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ user_id: data.user.id })
}
