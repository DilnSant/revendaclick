import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getUserIdFromHeaders, getTenantForUser, getUsageFromAPI } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import { getSubscription } from '@/lib/billing'
import PlanAlertBanner from '@/components/ui/PlanAlertBanner'
import SubscriptionBanner from '@/components/ui/SubscriptionBanner'
import DashboardShell from '@/components/layout/DashboardShell'

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  // Middleware injects x-user-id on protected routes; fall back to Supabase
  // getUser() for any route not yet in the middleware DASHBOARD_PREFIXES list.
  let uid = await getUserIdFromHeaders()

  const supabase = await createClient()

  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    uid = user.id
  }

  const tenant = await getTenantForUser(uid)
  if (!tenant) redirect('/onboarding')

  // Resolve access token — non-fatal so a Supabase hiccup won't crash the layout
  let token = ''
  let userEmail = ''
  try {
    const { data: { session } } = await supabase.auth.getSession()
    token     = session?.access_token ?? ''
    userEmail = session?.user?.email ?? ''
  } catch { /* degrade gracefully */ }

  const [usage, sub] = await Promise.all([
    getUsageFromAPI(token),
    getSubscription(),
  ])

  // Hard gate: blocked tenants (canceled or past_due beyond grace) may only access /billing
  if (sub?.is_blocked) {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') ?? ''
    if (!pathname.startsWith('/billing')) {
      redirect('/billing?reason=blocked')
    }
  }

  return (
    <DashboardShell
      tenantName={tenant.name}
      tenantSlug={tenant.slug}
      userEmail={userEmail}
      planDisplay={usage?.plan_display ?? ''}
      subscriptionStatus={sub?.status}
      planFeatures={usage ?? undefined}
    >
      <SubscriptionBanner sub={sub} />
      {usage && <PlanAlertBanner usage={usage} />}
      {children}
    </DashboardShell>
  )
}
