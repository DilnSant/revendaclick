import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getUserIdFromHeaders, getTenantStatusForUser, getTenantById, getUsageFromAPI, resolveUserRole, type TenantContext } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import { getSubscription } from '@/lib/billing'
import PlanAlertBanner from '@/components/ui/PlanAlertBanner'
import SubscriptionBanner from '@/components/ui/SubscriptionBanner'
import DashboardShell from '@/components/layout/DashboardShell'

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Middleware injects x-user-id on protected routes; fall back to user.id.
  const uid = (await getUserIdFromHeaders()) ?? user.id

  // FC059: defense-in-depth — resolve role with JWT-first + DB-fallback so
  // super_admin works even when app_metadata.user_role is missing in JWT
  // (FC058 cause: users promoted via SQL without syncing auth.users).
  const role = await resolveUserRole(user, user.id)
  if (role === 'super_admin') redirect('/admin')

  const tenantStatus = await getTenantStatusForUser(uid)
  if (!tenantStatus) redirect('/onboarding')

  // Redirect inactive tenants to the appropriate status page
  if (tenantStatus.deleted_at) redirect('/conta-suspensa?motivo=excluido')
  if (tenantStatus.quarantined_at) redirect('/conta-suspensa?motivo=quarentena')
  if (!tenantStatus.is_active) redirect('/conta-suspensa?motivo=bloqueado')

  const tenant: TenantContext = {
    id:              tenantStatus.id,
    slug:            tenantStatus.slug,
    name:            tenantStatus.name,
    phone_whatsapp:  tenantStatus.phone_whatsapp,
  }

  const fullTenant = await getTenantById(tenant.id)

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
      tenantLogoUrl={fullTenant?.logo_url ?? null}
      tenantColor={fullTenant?.theme?.primary_color ?? null}
    >
      <SubscriptionBanner sub={sub} />
      {usage && <PlanAlertBanner usage={usage} />}
      {children}
    </DashboardShell>
  )
}
