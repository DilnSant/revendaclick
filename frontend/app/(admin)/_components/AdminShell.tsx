'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'

// ─── Nav structure ────────────────────────────────────────────────────────────

const NAV = [
  {
    section: null,
    items: [
      {
        href: '/admin',
        label: 'Overview',
        exact: true,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Clientes',
    items: [
      {
        href: '/admin/tenants',
        label: 'Tenants',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        href: '/admin/leads',
        label: 'Leads Landing',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        href: '/admin/users',
        label: 'Usuários',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Financeiro',
    items: [
      {
        href: '/admin/subscriptions',
        label: 'Assinaturas',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
      },
      {
        href: '/admin/billing',
        label: 'Billing',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Plataforma',
    items: [
      {
        href: '/admin/plans',
        label: 'Planos',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
      },
      {
        href: '/admin/features',
        label: 'Features',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
        ),
      },
      {
        href: '/admin/whatsapps',
        label: 'WhatsApps',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Sistema',
    items: [
      {
        href: '/admin/analytics',
        label: 'Analytics',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        href: '/admin/logs',
        label: 'Logs',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        href: '/admin/settings',
        label: 'Configurações',
        exact: false,
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ],
  },
]

// ─── Shell ────────────────────────────────────────────────────────────────────

interface Props {
  userEmail: string
  children: React.ReactNode
}

export default function AdminShell({ userEmail, children }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 flex flex-col bg-gray-900 border-r border-gray-800
        transition-transform duration-200 ease-in-out lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo / brand */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-gray-800 px-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-600">
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-gray-100">RevendaClick</p>
            <p className="text-[10px] text-red-400 font-semibold tracking-wider uppercase">Admin</p>
          </div>
          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV.map(({ section, items }, gi) => (
            <div key={gi}>
              {section && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                  {section}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(({ href, label, icon, exact }) => {
                  const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/'))
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                      }`}
                    >
                      <span className={active ? 'text-red-400' : 'text-gray-600'}>
                        {icon}
                      </span>
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <AdminUserFooter userEmail={userEmail} />
      </aside>

      {/* Main */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-gray-800 bg-gray-900/95 backdrop-blur px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400">Admin</span>
        </header>

        {/* Desktop topbar */}
        <header className="hidden lg:flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900/95 backdrop-blur px-6 sticky top-0 z-10">
          <Breadcrumbs pathname={pathname} />
          <span className="text-xs text-gray-600">{userEmail}</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AdminUserFooter({ userEmail }: { userEmail: string }) {
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
    <div className="relative border-t border-gray-800 p-3">
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border border-gray-800 bg-gray-900 shadow-xl">
          <div className="border-b border-gray-800 px-3 py-2.5">
            <p className="text-xs font-medium text-gray-100 truncate">{userEmail}</p>
            <p className="text-[10px] text-red-400 font-semibold">super_admin</p>
          </div>
          <div className="p-1">
            <button
              onClick={handleLogout}
              disabled={pending}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-400 hover:bg-red-900/30 disabled:opacity-60"
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
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-gray-800 transition-colors"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-900/60 text-[10px] font-bold text-red-300">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-300">{userEmail}</p>
          <p className="text-[10px] text-red-400">super_admin</p>
        </div>
        <svg className={`h-4 w-4 shrink-0 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  )
}

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Admin',
  tenants: 'Tenants',
  leads: 'Leads Landing',
  users: 'Usuários',
  subscriptions: 'Assinaturas',
  billing: 'Billing',
  plans: 'Planos',
  features: 'Features',
  whatsapps: 'WhatsApps',
  analytics: 'Analytics',
  logs: 'Logs',
  settings: 'Configurações',
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split('/').filter(Boolean)
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1
        const label = ROUTE_LABELS[part] ?? part
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-700">/</span>}
            <span className={isLast ? 'font-medium text-gray-200' : 'text-gray-600'}>
              {label}
            </span>
          </span>
        )
      })}
    </nav>
  )
}
