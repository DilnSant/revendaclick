'use client'

import Link from 'next/link'
import { useState, useEffect, createContext, useContext } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import type { PlanUsage } from '@/lib/tenant'

// ─── Plan features context ─────────────────────────────────────────────────────

interface PlanFeatures {
  has_crm: boolean
  has_analytics: boolean
  has_whatsapp: boolean
  has_kanban: boolean
  has_api_access: boolean
  has_white_label: boolean
  has_central_atendimento: boolean
  has_whatsapp_qr: boolean
  has_financial: boolean
  has_vendors: boolean
  has_automation: boolean
  has_campaigns: boolean
}

// Defaults restrictive: unlock progressively from plan
const DEFAULT_FEATURES: PlanFeatures = {
  has_crm:                 false,
  has_analytics:           false,
  has_whatsapp:            false,
  has_kanban:              false,
  has_api_access:          false,
  has_white_label:         false,
  has_central_atendimento: false,
  has_whatsapp_qr:         false,
  has_financial:           false,
  has_vendors:             false,
  has_automation:          false,
  has_campaigns:           false,
}

const PlanFeaturesCtx = createContext<PlanFeatures>(DEFAULT_FEATURES)

export function usePlanFeatures() {
  return useContext(PlanFeaturesCtx)
}

// ─── Nav definition ───────────────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

// Base items — visible to all active users (Starter+)
const NAV_BASE: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  },
  {
    href: '/store',
    label: 'Página da Loja',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0a2.998 2.998 0 00.94-2.07 2.998 2.998 0 00.94-2.07m18 4.14a2.998 2.998 0 00-.94-2.07 2.998 2.998 0 00-.94-2.07" />
      </svg>
    ),
  },
  {
    href: '/vehicles',
    label: 'Veículos',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM7.3 7l1.4-3.6A1 1 0 019.6 3H17a1 1 0 01.9.6L19 7M3 11l1-4h16l1 4v4H3v-4z" />
      </svg>
    ),
  },
  {
    href: '/leads',
    label: 'Interessados',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V21a1 1 0 01-1.447.894l-4-2A1 1 0 017 19v-5.586L3.293 6.707A1 1 0 013 6V4z" />
      </svg>
    ),
  },
  {
    href: '/customers',
    label: 'Clientes',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/financial',
    label: 'Financeiro',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

// Pro+ items — visible when has_crm = true (Pro, Premium, Scale)
const NAV_PRO: NavItem[] = [
  {
    href: '/crm',
    label: 'Atendimento',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

// Premium+ items — visible when has_automation = true (Premium, Scale)
const NAV_PREMIUM: NavItem[] = [
  {
    href: '/automations',
    label: 'Automações',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '/campaigns',
    label: 'Campanhas',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  tenantName: string
  tenantSlug: string
  userEmail: string
  planDisplay: string
  subscriptionStatus?: string
  planFeatures?: Partial<PlanUsage>
  tenantLogoUrl?: string | null
  tenantColor?: string | null
  children: React.ReactNode
}

function hexToRgbChannels(hex: string): string | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return `${r} ${g} ${b}`
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function DashboardShell(props: Props) {
  const { tenantName, tenantSlug, userEmail, planDisplay, planFeatures, tenantLogoUrl, tenantColor, children } = props
  const rgbChannels = tenantColor ? hexToRgbChannels(tenantColor) : null
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const features: PlanFeatures = {
    has_crm:                 planFeatures?.has_crm                 ?? DEFAULT_FEATURES.has_crm,
    has_analytics:           planFeatures?.has_analytics           ?? DEFAULT_FEATURES.has_analytics,
    has_whatsapp:            planFeatures?.has_whatsapp            ?? DEFAULT_FEATURES.has_whatsapp,
    has_kanban:              planFeatures?.has_kanban              ?? DEFAULT_FEATURES.has_kanban,
    has_api_access:          planFeatures?.has_api_access          ?? DEFAULT_FEATURES.has_api_access,
    has_white_label:         planFeatures?.has_white_label         ?? DEFAULT_FEATURES.has_white_label,
    has_central_atendimento: planFeatures?.has_central_atendimento ?? DEFAULT_FEATURES.has_central_atendimento,
    has_whatsapp_qr:         planFeatures?.has_whatsapp_qr         ?? DEFAULT_FEATURES.has_whatsapp_qr,
    has_financial:           planFeatures?.has_financial           ?? DEFAULT_FEATURES.has_financial,
    has_vendors:             planFeatures?.has_vendors             ?? DEFAULT_FEATURES.has_vendors,
    has_automation:          planFeatures?.has_automation          ?? DEFAULT_FEATURES.has_automation,
    has_campaigns:           planFeatures?.has_campaigns           ?? DEFAULT_FEATURES.has_campaigns,
  }

  return (
    <PlanFeaturesCtx.Provider value={features}>
      <div
        className="min-h-screen bg-gray-50"
        style={rgbChannels ? ({ '--primary': rgbChannels } as React.CSSProperties) : undefined}
      >
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-gray-900 border-r border-white/[0.07]
          transition-transform duration-200 ease-in-out lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Logo */}
          <div className="flex h-36 shrink-0 items-center border-b border-white/10 px-4">
            {tenantLogoUrl ? (
              <div className="shrink-0 rounded-xl border border-primary/30 p-1.5 bg-white/[0.04]">
                <Image
                  src={tenantLogoUrl}
                  alt={tenantName}
                  width={200}
                  height={110}
                  style={{ height: '110px', width: 'auto', maxWidth: '200px' }}
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="shrink-0 rounded-xl border border-primary/30 p-1.5 bg-white/[0.04]">
                <Image
                  src="/logo.png"
                  alt="RevendaClick"
                  width={870}
                  height={592}
                  style={{ height: '110px', width: 'auto' }}
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </div>

          {/* Store identity */}
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs text-gray-400">Loja</p>
            <p className="truncate text-sm font-medium text-white">{tenantName}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              {planDisplay && (
                <span className="inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                  {planDisplay}
                </span>
              )}
              <a
                href={`/${tenantSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-200 transition-colors ml-auto"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver loja
              </a>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">

            {/* Base — Starter+ */}
            <NavGroup items={NAV_BASE} pathname={pathname} />

            {/* Pro+ — Atendimento + Analytics */}
            {features.has_crm && (
              <div>
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Pro
                </p>
                <NavGroup items={NAV_PRO} pathname={pathname} />
              </div>
            )}

            {/* Premium — Automações + Campanhas */}
            {features.has_automation && (
              <div>
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Premium
                </p>
                <NavGroup items={NAV_PREMIUM} pathname={pathname} />
              </div>
            )}

            {/* Always — Assinatura + Configurações */}
            <div className="space-y-0.5">
              <NavItem
                href="/billing"
                label="Assinatura"
                pathname={pathname}
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                }
              />
              <NavItem
                href="/settings"
                label="Configurações"
                pathname={pathname}
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            </div>
          </nav>

          {/* User footer */}
          <UserFooter userEmail={userEmail} tenantSlug={tenantSlug} />
        </aside>

        {/* Main area */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          {/* Mobile topbar */}
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-white/10 bg-gray-900 px-4 lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-gray-300 hover:bg-white/10 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {tenantLogoUrl ? (
              <div className="shrink-0 rounded-lg border border-primary/30 p-1 bg-white/[0.04]">
                <Image src={tenantLogoUrl} alt={tenantName} width={200} height={36}
                  style={{ height: '36px', width: 'auto', maxWidth: '140px' }} className="object-contain" />
              </div>
            ) : (
              <div className="shrink-0 rounded-lg border border-primary/30 p-1 bg-white/[0.04]">
                <Image src="/logo.png" alt="RevendaClick" width={870} height={592}
                  style={{ height: '36px', width: 'auto' }} className="object-contain" />
              </div>
            )}
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </PlanFeaturesCtx.Provider>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavGroup({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <div className="space-y-0.5">
      {items.map(item => (
        <NavItem key={item.href} {...item} pathname={pathname} />
      ))}
    </div>
  )
}

function NavItem({
  href, label, icon, pathname, exact,
}: NavItem & { pathname: string }) {
  const active = exact
    ? pathname === href
    : (pathname === href || pathname.startsWith(href + '/'))

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors
        ${active ? 'bg-primary/20 text-primary' : 'text-gray-300 hover:bg-white/10 hover:text-white'}
      `}
    >
      <span className={active ? 'text-primary' : 'text-gray-500'}>
        {icon}
      </span>
      {label}
    </Link>
  )
}

function UserFooter(props: { userEmail: string; tenantSlug: string }) {
  const { userEmail } = props
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const initials = userEmail.slice(0, 2).toUpperCase()

  async function handleLogout() {
    setPending(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative border-t border-white/10 p-3">
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border border-gray-100 bg-white shadow-lg">
          <div className="border-b border-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium text-gray-900 truncate">{userEmail}</p>
          </div>
          <div className="p-1">
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configurações
            </Link>
            <button
              onClick={handleLogout}
              disabled={pending}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {pending ? 'Saindo…' : 'Sair'}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-white/10 transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-white">{userEmail}</p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  )
}

