import { redirect } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser, getTenantUsage } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import PlanAlertBanner from '@/components/ui/PlanAlertBanner'
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

  const [tenant, usage, supabase] = await Promise.all([
    getTenantForUser(uid),
    getTenantForUser(uid).then((t) => (t ? getTenantUsage(t.id) : null)),
    createClient(),
  ])

  if (!tenant) redirect('/onboarding')

  const { data: { session } } = await supabase.auth.getSession()
  const userEmail = session?.user?.email ?? ''

  return (
    <DashboardShell
      tenantName={tenant.name}
      tenantSlug={tenant.slug}
      userEmail={userEmail}
      planDisplay={usage?.plan_display ?? ''}
    >
      {usage && <PlanAlertBanner usage={usage} />}
      {children}
    </DashboardShell>
  )
}
