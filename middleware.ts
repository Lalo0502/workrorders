import { NextResponse, type NextRequest } from 'next/server'

// Protect dashboard routes by requiring a Supabase auth cookie.
// This is a lightweight check that avoids hitting Supabase on every request.
// If you prefer full validation, we can switch to @supabase/auth-helpers-nextjs later.

function hasSupabaseSessionCookie(req: NextRequest) {
  const all = req.cookies.getAll().map((c) => c.name)

  // Common cookie names used by Supabase auth (may vary by setup):
  // - 'sb-access-token', 'sb-refresh-token'
  // - cookies prefixed with 'sb-' (project based) or 'sb:' (auth-helpers)
  // We check a few safe patterns to determine if a session likely exists.
  const direct = all.some((n) => n === 'sb-access-token' || n === 'sb-refresh-token' || n === 'sb:token')
  if (direct) return true

  const prefixed = all.some((n) => n.startsWith('sb-') && (n.endsWith('-auth-token') || n.endsWith('-access-token') || n.endsWith('-refresh-token')))
  return prefixed
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl

  // Only guard dashboard; login should remain accessible
  const isDashboard = url.pathname.startsWith('/dashboard')
  if (!isDashboard) {
    return NextResponse.next()
  }

  const isLoggedIn = hasSupabaseSessionCookie(req)
  if (isLoggedIn) {
    return NextResponse.next()
  }

  // Redirect to login preserving destination
  const redirectUrl = new URL('/login', req.url)
  redirectUrl.searchParams.set('redirectTo', url.pathname + url.search)
  return NextResponse.redirect(redirectUrl)
}

// Temporarily disabled matcher while client-side guard handles protection.
// We'll migrate to @supabase/auth-helpers-nextjs later to sync cookies and re-enable edge checks.
export const config = {
  matcher: [],
}
