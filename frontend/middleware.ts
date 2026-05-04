import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Route classification ─────────────────────────────────────────────────────

/**
 * First URL segments that are NOT tenant slugs.
 * Extend this list whenever a new top-level route group is added.
 */
const RESERVED = new Set([
  'dashboard',
  'vehicles',
  'leads',
  'customers',
  'vendors',
  'analytics',
  'crm',
  'financial',
  'sales',
  'settings',
  'onboarding',
  'login',
  'register',
  'forgot-password',
  'reset-password',
  'auth',
  'api',
  '_next',
  'static',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'not-found',
])

/** Prefixes that require an authenticated session. */
const DASHBOARD_PREFIXES = [
  '/dashboard',
  '/vehicles',
  '/leads',
  '/customers',
  '/vendors',
  '/analytics',
  '/crm',
  '/financial',
  '/sales',
  '/settings',
  '/onboarding',
]

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Step 1: Refresh Supabase auth session ──────────────────────────────────
  //
  // We use the mutable-reference pattern required by @supabase/ssr so that any
  // token rotation is written back to the response cookies automatically.
  //
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Also set on the request so the new cookies travel with the next() call
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set({ name, value })
          )
          // Rebuild the response so these cookies are sent to the browser
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: use getUser() (not getSession()) — getUser() validates the JWT
  // server-side and cannot be spoofed by a modified cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Step 2: Dashboard routes ───────────────────────────────────────────────

  if (DASHBOARD_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Inject user identity into request headers for server components
    return buildResponse(request, supabaseResponse, {
      'x-user-id': user.id,
      'x-user-email': user.email ?? '',
    })
  }

  // ── Step 3: Public store routes (/[slug] and /[slug]/[vehicle]) ────────────

  const firstSegment = pathname.split('/').filter(Boolean)[0]

  if (firstSegment && !RESERVED.has(firstSegment)) {
    const tenant = await resolveTenantBySlug(firstSegment)

    if (!tenant) {
      // Slug doesn't match any active tenant — show 404
      const notFoundUrl = request.nextUrl.clone()
      notFoundUrl.pathname = '/not-found'
      return NextResponse.rewrite(notFoundUrl)
    }

    // Inject tenant context into request headers so every server component on
    // this route can read it without an extra DB round-trip.
    return buildResponse(request, supabaseResponse, {
      'x-tenant-id': tenant.id,
      'x-tenant-slug': tenant.slug,
      'x-tenant-name': tenant.name,
      'x-tenant-whatsapp': tenant.phone_whatsapp,
    })
  }

  // ── Step 4: Pass through (login, root, etc.) ───────────────────────────────
  return supabaseResponse
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a NextResponse that:
 *   • carries the custom REQUEST headers (visible to server components via `headers()`)
 *   • preserves every Supabase cookie set during session refresh
 *
 * We cannot mutate `supabaseResponse.request.headers` after creation, so we
 * create a new NextResponse with our enriched headers and copy cookies across.
 */
function buildResponse(
  originalRequest: NextRequest,
  supabaseResponse: NextResponse,
  inject: Record<string, string>
): NextResponse {
  const enriched = new Headers(originalRequest.headers)
  Object.entries(inject).forEach(([k, v]) => enriched.set(k, v))

  const response = NextResponse.next({
    request: { headers: enriched },
  })

  // Copy all cookies (auth tokens, PKCE state, etc.) to the outgoing response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie)
  })

  return response
}

/**
 * Resolve a tenant by slug via the Supabase REST API using the service-role key.
 * Service role bypasses RLS — safe here because we're only reading public tenant
 * data and this code runs server-side only.
 *
 * `next: { revalidate: 60 }` leverages Next.js's extended fetch cache so popular
 * store slugs don't hit the database on every page view.
 */
async function resolveTenantBySlug(slug: string): Promise<{
  id: string
  slug: string
  name: string
  phone_whatsapp: string
} | null> {
  const url =
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/tenants` +
    `?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true` +
    `&select=id,slug,name,phone_whatsapp&limit=1`

  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
      },
      // Cache for 60 s; stale entry still served while revalidating in background
      next: { revalidate: 60 },
    })

    if (!res.ok) return null

    const rows = await res.json()
    return rows[0] ?? null
  } catch {
    // Fail open: if the DB is unreachable, don't crash the whole app
    return null
  }
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *  - _next/static  (static chunks)
     *  - _next/image   (image optimization)
     *  - favicon.ico
     *  - image files   (svg, png, jpg, jpeg, gif, webp, ico)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
