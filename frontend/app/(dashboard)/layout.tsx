import { redirect } from 'next/navigation'
import { getUserIdFromHeaders, getTenantForUser, getTenantUsage } from '@/lib/tenant'
import { createClient } from '@/lib/supabaseServer'
import PlanAlertBanner from '@/components/ui/PlanAlertBanner'

interface Props {
  children: React.ReactNode
}

/**
 * Root layout for all dashboard routes.
 *
 * Auth is enforced by the middleware (redirect to /login if no session).
 * This layout is a second layer of protection and fetches the full
 * tenant + plan usage context for every dashboard page.
 */
export default async function DashboardLayout({ children }: Props) {
  // Middleware injects x-user-id on authenticated dashboard requests.
  const userId = await getUserIdFromHeaders()

  // Belt-and-suspenders: also check the Supabase session.
  if (!userId) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
  }

  const uid = userId!
  const [tenant, usage] = await Promise.all([
    getTenantForUser(uid),
    getTenantForUser(uid).then((t) => (t ? getTenantUsage(t.id) : null)),
  ])

  if (!tenant) {
    // User authenticated but not linked to a tenant — send to onboarding.
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Plan usage alerts */}
      {usage && <PlanAlertBanner usage={usage} />}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 border-r border-gray-100 bg-white lg:block">
          <nav className="sticky top-0 flex flex-col gap-1 p-4 pt-8">
            <SidebarItem href="/dashboard" label="Dashboard" />
            <SidebarItem href="/vehicles" label="Veículos" />
            <SidebarItem href="/leads" label="Leads" />
            <SidebarItem href="/settings" label="Configurações" />
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-6">
              <span className="font-semibold text-gray-900">{tenant.name}</span>
              {usage && (
                <span className="text-xs text-gray-500">
                  Plano {usage.plan_display}
                </span>
              )}
            </div>
          </header>

          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}

function SidebarItem({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600
                 transition-colors hover:bg-gray-50 hover:text-gray-900"
    >
      {label}
    </a>
  )
}
