/**
 * Guest session ID — stored in localStorage for guest estimate saving.
 */
const SESSION_KEY = 'igcse_guest_session_id'

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''

  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing

  const id = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, id)
  return id
}

export function getSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_KEY)
}

export function clearSessionId() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}
