import { redirect } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser, getTenantUsage } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import { getSubscription } from '@/lib/billing'
import PlanAlertBanner from '@/components/ui/PlanAlertBanner'
import SubscriptionBanner from '@/components/ui/SubscriptionBanner'
import DashboardShell from '@/components/layout/DashboardShell'

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const userId = await getUserIdFromHeaders()

  if (!userId) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
  }

  const uid = userId!

  const [tenant, supabase] = await Promise.all([
    getTenantForUser(uid),
    createClient(),
  ])

  if (!tenant) redirect('/onboarding')

  const [usage, sub] = await Promise.all([
    getTenantUsage(tenant.id),
    getSubscription(),
  ])

  const { data: { session } } = await supabase.auth.getSession()
  const userEmail = session?.user?.email ?? ''

  return (
    <DashboardShell
      tenantName={tenant.name}
      tenantSlug={tenant.slug}
      userEmail={userEmail}
      planDisplay={usage?.plan_display ?? ''}
      subscriptionStatus={sub?.status}
    >
      <SubscriptionBanner sub={sub} />
      {usage && <PlanAlertBanner usage={usage} />}
      {children}
    </DashboardShell>
  )
}
