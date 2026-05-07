'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_MAIN = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
  },
  {
    href: '/vehicles',
    label: 'Veículos',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM7.3 7l1.4-3.6A1 1 0 019.6 3H17a1 1 0 01.9.6L19 7M3 11l1-4h16l1 4v4H3v-4z" />
      </svg>
    ),
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V21a1 1 0 01-1.447.894l-4-2A1 1 0 017 19v-5.586L3.293 6.707A1 1 0 013 6V4z" />
      </svg>
    ),
  },
  {
    href: '/customers',
    label: 'Clientes',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/vendors',
    label: 'Vendedores',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: '/sales',
    label: 'Vendas',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
]

const NAV_ANALYSIS = [
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '/crm',
    label: 'CRM',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: '/financial',
    label: 'Financeiro',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const NAV_SYSTEM = [
  {
    href: '/whatsapp',
    label: 'WhatsApp',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Configurações',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 016 0z" />
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
  children: React.ReactNode
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export default function DashboardShell({
  tenantName, tenantSlug, userEmail, planDisplay, children,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile sidebar on route change
  const pathname = usePathname()
  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-white border-r border-gray-100 shadow-sm
        transition-transform duration-200 lg:translate-x-0 lg:shadow-none
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-gray-100 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-xs font-bold text-white">
            RC
          </div>
          <span className="text-sm font-bold text-gray-900">RevendaClick</span>
        </div>

        {/* Store name */}
        <div className="border-b border-gray-50 px-4 py-3">
          <p className="text-xs text-gray-400">Loja</p>
          <p className="truncate text-sm font-medium text-gray-800">{tenantName}</p>
          {planDisplay && (
            <span className="mt-0.5 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
              {planDisplay}
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <NavGroup items={NAV_MAIN} pathname={pathname} />

          <div>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Análise
            </p>
            <NavGroup items={NAV_ANALYSIS} pathname={pathname} />
          </div>

          <div>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Sistema
            </p>
            <NavGroup items={NAV_SYSTEM} pathname={pathname} />
          </div>
        </nav>

        {/* User footer */}
        <UserFooter
          userEmail={userEmail}
          tenantSlug={tenantSlug}
        />
      </aside>

      {/* Main area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-gray-100 bg-white/90 backdrop-blur px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-800">{tenantName}</span>
        </header>

        {/* Desktop topbar */}
        <header className="hidden lg:flex h-14 items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur px-6 sticky top-0 z-10">
          <Breadcrumbs pathname={pathname} />
          <div className="flex items-center gap-3">
            <a
              href={`/loja/${tenantSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver loja
            </a>
            <span className="text-xs text-gray-400">{userEmail}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavGroup({
  items,
  pathname,
}: {
  items: typeof NAV_MAIN
  pathname: string
}) {
  return (
    <div className="space-y-0.5">
      {items.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <a
            key={href}
            href={href}
            className={`
              flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors
              ${active
                ? 'bg-red-50 text-red-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <span className={active ? 'text-red-600' : 'text-gray-400'}>
              {icon}
            </span>
            {label}
          </a>
        )
      })}
    </div>
  )
}

function UserFooter({ userEmail, tenantSlug }: { userEmail: string; tenantSlug: string }) {
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
    <div className="relative border-t border-gray-100 p-3">
      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border border-gray-100 bg-white shadow-lg">
          <div className="border-b border-gray-50 px-3 py-2.5">
            <p className="text-xs font-medium text-gray-900 truncate">{userEmail}</p>
          </div>
          <div className="p-1">
            <a
              href="/settings"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configurações
            </a>
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
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-800">{userEmail}</p>
        </div>
        <svg className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  )
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  vehicles: 'Veículos',
  leads: 'Leads',
  customers: 'Clientes',
  vendors: 'Vendedores',
  sales: 'Vendas',
  analytics: 'Analytics',
  crm: 'CRM',
  financial: 'Financeiro',
  whatsapp: 'WhatsApp',
  settings: 'Configurações',
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return <span className="text-sm text-gray-500">Início</span>

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1
        const label = ROUTE_LABELS[part] ?? part
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300">/</span>}
            <span className={isLast ? 'font-medium text-gray-900' : 'text-gray-400'}>
              {label}
            </span>
          </span>
        )
      })}
    </nav>
  )
}
