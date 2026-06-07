import { createServiceClient } from '@/lib/supabaseServer'

export const metadata = { title: 'Configurações — Admin RevendaClick' }

export default async function AdminSettingsPage() {
  const db = createServiceClient()

  const [
    { data: plans },
    { data: planAddons },
    { count: tenantCount },
    { count: userCount },
  ] = await Promise.all([
    db.from('plans').select('name, display_name, price_monthly, features, is_active').order('price_monthly'),
    db.from('plan_addons').select('type, name, price_monthly, is_active'),
    db.from('tenants').select('*', { count: 'exact', head: true }),
    db.from('users').select('*', { count: 'exact', head: true }),
  ])

  const envVars = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', set: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key', set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key', set: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { key: 'NEXT_PUBLIC_API_URL', label: 'API URL', set: !!process.env.NEXT_PUBLIC_API_URL, value: process.env.NEXT_PUBLIC_API_URL },
    { key: 'INTERNAL_API_URL', label: 'Internal API URL', set: !!process.env.INTERNAL_API_URL, value: process.env.INTERNAL_API_URL },
    { key: 'WEBHOOK_SECRET', label: 'Webhook Secret', set: !!process.env.WEBHOOK_SECRET },
    { key: 'WEBHOOK_LEADS_URL', label: 'Webhook Leads URL', set: !!process.env.WEBHOOK_LEADS_URL, value: process.env.WEBHOOK_LEADS_URL },
    { key: 'META_PIXEL_ID', label: 'Meta Pixel ID', set: !!process.env.META_PIXEL_ID, value: process.env.NEXT_PUBLIC_META_PIXEL_ID },
    { key: 'NEXT_PUBLIC_GA_ID', label: 'Google Analytics ID', set: !!process.env.NEXT_PUBLIC_GA_ID, value: process.env.NEXT_PUBLIC_GA_ID },
    { key: 'NEXT_PUBLIC_TIKTOK_PIXEL_ID', label: 'TikTok Pixel ID', set: !!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID, value: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-white">Configurações</h1>
        <p className="mt-0.5 text-sm text-gray-500">Configuração global da plataforma RevendaClick</p>
      </div>

      {/* Platform info */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Plataforma</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoCard label="Tenants" value={String(tenantCount ?? 0)} />
          <InfoCard label="Usuários" value={String(userCount ?? 0)} />
          <InfoCard label="Planos" value={String((plans ?? []).length)} />
          <InfoCard label="Add-ons" value={String((planAddons ?? []).length)} />
        </div>
      </section>

      {/* Infraestrutura */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Infraestrutura</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
          {[
            { label: 'VPS', value: '2.24.67.84 (Hostinger)', ok: true },
            { label: 'Supabase Project', value: 'ibgaywezfcbbiiziaoac', ok: true },
            { label: 'Frontend', value: 'Vercel — app.revendaclick.com.br', ok: true },
            { label: 'Backend', value: 'api.revendaclick.com.br (Docker)', ok: true },
            { label: 'Evolution API', value: 'evolution.revendaclick.com.br (v2.3.7)', ok: true },
            { label: 'Redis', value: 'rc_redis — cache Evolution habilitado', ok: true },
            { label: 'CI/CD', value: 'GitHub Actions → GHCR → self-hosted runner', ok: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-gray-400">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{item.value}</span>
                <span className={`h-2 w-2 rounded-full ${item.ok ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Planos cadastrados</h2>
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Nome', 'Display', 'Preço/mês', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 bg-gray-900">
              {(plans ?? []).map((p: any) => (
                <tr key={p.name} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-red-300">{p.name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-200">{p.display_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {Number(p.price_monthly).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${p.is_active ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {p.is_active ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add-ons */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Add-ons disponíveis</h2>
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-left">
                {['Tipo', 'Nome', 'Preço/mês', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 bg-gray-900">
              {(planAddons ?? []).map((a: any) => (
                <tr key={a.type} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{a.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-200">{a.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {Number(a.price_monthly).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${a.is_active ? 'bg-green-900/40 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {a.is_active ? 'ativo' : 'inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Env Vars */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Variáveis de ambiente</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 divide-y divide-gray-800">
          {envVars.map(v => (
            <div key={v.key} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-mono text-xs text-gray-400">{v.key}</p>
                <p className="text-[10px] text-gray-700">{v.label}</p>
              </div>
              <div className="flex items-center gap-2">
                {v.value && (
                  <span className="text-[10px] text-gray-600 max-w-[200px] truncate">{v.value}</span>
                )}
                <span className={`inline-flex h-2 w-2 rounded-full ${v.set ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-[10px] ${v.set ? 'text-green-500' : 'text-red-500'}`}>
                  {v.set ? 'configurada' : 'ausente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Links operacionais */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">Links operacionais</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: 'Supabase Dashboard', url: 'https://supabase.com/dashboard/project/ibgaywezfcbbiiziaoac', desc: 'Banco + Auth + RLS' },
            { label: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', desc: 'Frontend deploy' },
            { label: 'Asaas Dashboard', url: 'https://www.asaas.com', desc: 'Billing / cobranças' },
            { label: 'GitHub Actions', url: 'https://github.com/DilnSant/revendaclick/actions', desc: 'CI/CD pipeline' },
          ].map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 hover:border-gray-700 hover:bg-gray-800/50 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-gray-200 group-hover:text-white">{link.label}</p>
                <p className="text-xs text-gray-600">{link.desc}</p>
              </div>
              <svg className="h-4 w-4 text-gray-700 group-hover:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{label}</p>
      <p className="mt-1.5 text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
