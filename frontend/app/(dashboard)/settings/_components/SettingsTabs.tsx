'use client'

import Link from 'next/link'
import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateTenantProfile, subscribePlan, saveStoreContact } from '../actions'
import type { SubscriptionData, StoreContactData } from '../actions'
import { inviteVendor } from '@/app/(dashboard)/vendors/actions'
import type { User } from '@/lib/users'
import { ROLE_LABELS, ROLE_COLORS, userInitials } from '@/lib/users'
import type { ToastMessage } from '@/components/ui/Toast'
import ToastContainer from '@/components/ui/Toast'

interface TenantData {
  id: string
  slug: string
  name: string
  email: string
  phone_whatsapp: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
  logo_url: string | null
  theme: { primary_color?: string } | null
  address: { city?: string; state?: string; street?: string } | null
}

interface Props {
  tab: string
  tenant: TenantData
  users: User[]
  subscription: SubscriptionData | null
  storeContact: StoreContactData | null
}

export default function SettingsTabs({ tab, tenant, users, subscription, storeContact }: Props) {
  const [toasts, setToasts]         = useState<ToastMessage[]>([])
  const toastIdRef                  = useRef(0)

  function addToast(t: Omit<ToastMessage, 'id'>) {
    setToasts(prev => [...prev, { ...t, id: ++toastIdRef.current }])
  }

  return (
    <>
      {/* Tabs nav */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1">
          {[
            { key: 'store',     label: 'Loja' },
            { key: 'contact',   label: 'Contato Público' },
            { key: 'users',     label: 'Usuários' },
            { key: 'plan',      label: 'Plano' },
            { key: 'whatsapp',  label: 'WhatsApp' },
          ].map(({ key, label }) => (
            <a
              key={key}
              href={`/settings?tab=${key}`}
              className={`px-4 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'store'    && <StoreTab tenant={tenant} onToast={addToast} />}
      {tab === 'contact'  && <ContactTab storeContact={storeContact} onToast={addToast} />}
      {tab === 'users'    && <UsersTab users={users} subscription={subscription} />}
      {tab === 'plan'     && <PlanTab initialSubscription={subscription} />}
      {tab === 'whatsapp' && <WhatsAppTab />}

      <ToastContainer toasts={toasts} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />
    </>
  )
}

// ─── Store Tab ────────────────────────────────────────────────────────────────

function StoreTab({ tenant, onToast }: { tenant: TenantData; onToast: (t: Omit<ToastMessage, 'id'>) => void }) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name:            tenant.name,
    phone_whatsapp:  tenant.phone_whatsapp,
    description:     tenant.description ?? '',
    city:            tenant.address?.city ?? '',
    state:           tenant.address?.state ?? '',
    primary_color:   tenant.theme?.primary_color ?? '#E53935',
    seo_title:       tenant.seo_title ?? '',
    seo_description: tenant.seo_description ?? '',
  })
  const [logoUrl, setLogoUrl]         = useState<string | null>(tenant.logo_url)
  const [logoUploading, setLogoUploading] = useState(false)
  const [pending, startTransition]    = useTransition()

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/logo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { onToast({ type: 'error', text: data.error ?? 'Erro no upload' }); return }
      setLogoUrl(data.url)
      onToast({ type: 'success', text: 'Logo carregada. Clique em Salvar para confirmar.' })
    } catch {
      onToast({ type: 'error', text: 'Erro ao enviar logo.' })
    } finally {
      setLogoUploading(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateTenantProfile({
        name:            form.name.trim() || undefined,
        phone_whatsapp:  form.phone_whatsapp.trim() || undefined,
        description:     form.description.trim() || undefined,
        seo_title:       form.seo_title.trim() || undefined,
        seo_description: form.seo_description.trim() || undefined,
        logo_url:        logoUrl ?? undefined,
        theme:           { primary_color: form.primary_color },
        address:         (form.city || form.state)
                           ? { city: form.city.trim(), state: form.state.trim() }
                           : undefined,
      })
      if (result.error) {
        onToast({ type: 'error', text: result.error.message })
      } else {
        onToast({ type: 'success', text: 'Loja atualizada com sucesso.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Logo + identidade */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Identidade visual</h2>

        {/* Logo upload */}
        <div>
          <label className="label">Logo da loja</label>
          <div className="flex items-center gap-4">
            <div
              className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden hover:border-primary/60 transition-colors"
              onClick={() => logoInputRef.current?.click()}
            >
              {logoUploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-2xl text-gray-300">+</span>
              )}
            </div>
            <div>
              <button
                type="button"
                disabled={logoUploading}
                onClick={() => logoInputRef.current?.click()}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {logoUploading ? 'Enviando…' : 'Alterar logo'}
              </button>
              <p className="mt-1 text-xs text-gray-400">PNG, JPG ou WebP — máx 2 MB</p>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        {/* Primary color */}
        <div>
          <label className="label">Cor principal da loja</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primary_color}
              onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
              className="h-9 w-14 cursor-pointer rounded-lg border border-gray-200 p-0.5"
            />
            <input
              type="text"
              value={form.primary_color}
              onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
              maxLength={7}
              className="input w-32 font-mono text-sm"
              placeholder="#E53935"
            />
            <span className="text-xs text-gray-400">Afeta botões e destaques na vitrine pública</span>
          </div>
        </div>
      </div>

      {/* Dados básicos */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Dados da loja</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nome da loja *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required maxLength={80}
              className="input"
            />
          </div>
          <div>
            <label className="label">WhatsApp *</label>
            <input
              value={form.phone_whatsapp}
              onChange={e => setForm(f => ({ ...f, phone_whatsapp: e.target.value }))}
              required
              className="input"
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Cidade</label>
            <input
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              maxLength={80}
              className="input"
              placeholder="Florianópolis"
            />
          </div>
          <div>
            <label className="label">Estado</label>
            <input
              value={form.state}
              onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
              maxLength={2}
              className="input"
              placeholder="SC"
            />
          </div>
        </div>

        <div>
          <label className="label">Endereço da vitrine</label>
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            revendaclick.com.br/<span className="font-medium text-gray-700">{tenant.slug}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">O slug não pode ser alterado.</p>
        </div>

        <div>
          <label className="label">Slogan / Descrição da loja</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3} maxLength={500}
            className="input resize-none"
            placeholder="Ex: Os melhores seminovos de Santa Catarina"
          />
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900">SEO</h2>
        <div>
          <label className="label">Título SEO <span className="text-gray-400">({form.seo_title.length}/70)</span></label>
          <input
            value={form.seo_title}
            onChange={e => setForm(f => ({ ...f, seo_title: e.target.value }))}
            maxLength={70}
            className="input"
            placeholder={`${tenant.name} — Veículos`}
          />
        </div>
        <div>
          <label className="label">Meta description <span className="text-gray-400">({form.seo_description.length}/160)</span></label>
          <textarea
            value={form.seo_description}
            onChange={e => setForm(f => ({ ...f, seo_description: e.target.value }))}
            rows={2} maxLength={160}
            className="input resize-none"
            placeholder="Descrição breve para mecanismos de busca..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={pending || logoUploading} className="btn-primary">
          {pending ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}

// ─── Contact Tab ──────────────────────────────────────────────────────────────

function ContactTab({
  storeContact,
  onToast,
}: {
  storeContact: StoreContactData | null
  onToast: (t: Omit<ToastMessage, 'id'>) => void
}) {
  const [form, setForm] = useState({
    public_whatsapp: storeContact?.public_whatsapp ?? '',
    public_phone:    storeContact?.public_phone ?? '',
    public_email:    storeContact?.public_email ?? '',
    instagram:       storeContact?.instagram ?? '',
    groups_link:     storeContact?.groups_link ?? '',
    location:        storeContact?.location ?? '',
  })
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveStoreContact({
        public_whatsapp: form.public_whatsapp.trim() || null,
        public_phone:    form.public_phone.trim() || null,
        public_email:    form.public_email.trim() || null,
        instagram:       form.instagram.trim() || null,
        groups_link:     form.groups_link.trim() || null,
        location:        form.location.trim() || null,
      })
      if (result.error) {
        onToast({ type: 'error', text: result.error.message })
      } else {
        onToast({ type: 'success', text: 'Contato público atualizado com sucesso.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-3.5">
        <p className="text-sm font-semibold text-blue-900">Contato público da loja</p>
        <p className="mt-0.5 text-xs text-blue-700">
          Esses dados aparecem na vitrine pública para clientes entrarem em contato.
          Independente da Automação WhatsApp.
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Canais de contato</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">WhatsApp da loja</label>
            <input
              type="tel"
              value={form.public_whatsapp}
              onChange={e => setForm(f => ({ ...f, public_whatsapp: e.target.value }))}
              maxLength={20}
              className="input"
              placeholder="(11) 99999-9999"
            />
            <p className="mt-1 text-xs text-gray-400">Botão de WhatsApp exibido na vitrine</p>
          </div>
          <div>
            <label className="label">Telefone fixo</label>
            <input
              type="tel"
              value={form.public_phone}
              onChange={e => setForm(f => ({ ...f, public_phone: e.target.value }))}
              maxLength={20}
              className="input"
              placeholder="(11) 3333-4444"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">E-mail de contato</label>
            <input
              type="email"
              value={form.public_email}
              onChange={e => setForm(f => ({ ...f, public_email: e.target.value }))}
              maxLength={120}
              className="input"
              placeholder="contato@minha-loja.com.br"
            />
          </div>
          <div>
            <label className="label">Instagram</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">@</span>
              <input
                type="text"
                value={form.instagram}
                onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
                maxLength={60}
                className="input pl-7"
                placeholder="minha_loja"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Link do grupo WhatsApp</label>
          <input
            type="url"
            value={form.groups_link}
            onChange={e => setForm(f => ({ ...f, groups_link: e.target.value }))}
            maxLength={300}
            className="input"
            placeholder="https://chat.whatsapp.com/..."
          />
          <p className="mt-1 text-xs text-gray-400">Link de convite para grupo de ofertas ou novidades</p>
        </div>

        <div>
          <label className="label">Endereço / Localização</label>
          <input
            type="text"
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            maxLength={200}
            className="input"
            placeholder="Rua das Flores, 100 — São Paulo, SP"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Salvando…' : 'Salvar contato'}
        </button>
      </div>
    </form>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

const MEMBER_ROLES = [
  { value: 'admin',  label: 'Administrador' },
  { value: 'seller', label: 'Gerente' },
]

function UsersTab({ users, subscription }: { users: User[]; subscription: SubscriptionData | null }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('admin')
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const isBlocked = subscription?.status === 'trialing' || !subscription

  function openModal() {
    setName(''); setEmail(''); setPhone(''); setRole('admin')
    setFormError(null); setInviteLink(null); setInviteSuccess(false)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    startTransition(async () => {
      const res = await inviteVendor(email.trim(), name.trim(), role, phone.trim() || undefined)
      if (res.error) { setFormError(res.error); return }
      setInviteLink(res.inviteLink ?? null)
      setInviteSuccess(true)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <h2 className="text-base font-semibold text-gray-900">
            Equipe
            <span className="ml-2 text-sm font-normal text-gray-400">{users.length} usuário{users.length !== 1 ? 's' : ''}</span>
          </h2>
          <div className="flex items-center gap-3">
            <Link href="/vendors" className="text-xs font-medium text-primary hover:text-primary/90">
              Vendedores →
            </Link>
            {!isBlocked && (
              <button
                onClick={openModal}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
              >
                + Convidar Membro
              </button>
            )}
          </div>
        </div>

        {users.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                  {userInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role] ?? ROLE_COLORS.viewer}`}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
                <span className={`h-2 w-2 shrink-0 rounded-full ${u.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {isBlocked && (
        <p className="text-xs text-gray-400">
          Convites para administradores e gerentes estarão disponíveis após a ativação do plano.
        </p>
      )}

      {/* Invite modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-gray-900">Convidar Membro</h3>

            {inviteSuccess ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  Membro cadastrado com sucesso.
                </div>
                {inviteLink && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-700">Link de acesso — compartilhe com o membro:</p>
                    <p className="text-xs text-gray-500 break-all font-mono">{inviteLink}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(inviteLink)}
                      className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                    >
                      Copiar link
                    </button>
                  </div>
                )}
                <button onClick={closeModal} className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700">
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="mt-4 space-y-3">
                <div>
                  <label className="label">Nome completo <span className="text-red-500">*</span></label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Maria Silva" />
                </div>
                <div>
                  <label className="label">E-mail <span className="text-red-500">*</span></label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="maria@loja.com.br" />
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="(11) 99999-0000" />
                </div>
                <div>
                  <label className="label">Função <span className="text-red-500">*</span></label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="input">
                    {MEMBER_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                {formError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{formError}</div>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                    {pending ? 'Cadastrando…' : 'Cadastrar membro'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── WhatsApp Tab ─────────────────────────────────────────────────────────────

function WhatsAppTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Automação de Atendimento WhatsApp</h2>
        <p className="text-sm text-gray-600">
          Receba contatos via WhatsApp e registre automaticamente todas as oportunidades no CRM.
          Disponível como recurso adicional em qualquer plano.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/whatsapp"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Abrir Automação WhatsApp
          </a>
          <a
            href="/billing/addons"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Ver recursos disponíveis →
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Plan Tab ─────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'starter',
    display: 'Starter',
    monthly: 97,
    yearly: 970,
    features: ['Até 30 veículos', '4 usuários', '200 leads/mês', 'Marketplace', 'WhatsApp Button'],
  },
  {
    name: 'pro',
    display: 'Pro',
    monthly: 197,
    yearly: 1970,
    features: ['Até 60 veículos', '8 usuários', '500 leads/mês', 'CRM completo', 'Kanban', 'Domínio personalizado'],
  },
  {
    name: 'premium',
    display: 'Premium',
    monthly: 397,
    yearly: 3970,
    features: ['Até 120 veículos', '20 usuários', '2000 leads/mês', 'Analytics', 'Suporte prioritário', 'API access'],
  },
]

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  trialing: 'Trial',
  past_due: 'Em atraso',
  canceled: 'Cancelado',
  paused: 'Pausado',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-orange-100 text-orange-700',
  canceled: 'bg-red-100 text-red-700',
  paused: 'bg-gray-100 text-gray-700',
}

function PlanTab({ initialSubscription }: { initialSubscription: SubscriptionData | null }) {
  const router = useRouter()
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [pending, startTransition] = useTransition()
  const [pendingPlan, setPendingPlan] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(initialSubscription)
  const [planError, setPlanError] = useState<string | null>(null)
  const [planSuccess, setPlanSuccess] = useState<string | null>(null)

  function handleSubscribe(planName: string) {
    setPendingPlan(planName)
    setPlanError(null)
    setPlanSuccess(null)
    startTransition(async () => {
      try {
        // Assinatura ativa em plano diferente → endpoint de upgrade
        if (subscription?.status === 'active' && subscription.plan_name !== planName) {
          const res = await fetch('/api/billing/upgrade-action', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_name: planName, billing_cycle: cycle }),
          })
          const data = await res.json()
          if (!res.ok) {
            setPlanError(data.error ?? 'Erro ao alterar plano. Tente novamente.')
          } else {
            setSubscription(data as SubscriptionData)
            setPlanSuccess('Plano alterado! A nova cobrança será aplicada no próximo ciclo.')
            router.refresh()
          }
          return
        }

        // Nova assinatura ou ativação de trial
        const result = await subscribePlan(planName, cycle)
        if (!result.error) {
          // Guard ativado: backend retornou assinatura existente em plano diferente
          if (result.data.plan_name !== planName && result.data.asaas_subscription_id) {
            setPlanError('Você já possui uma assinatura ativa. Para trocar de plano, acesse a aba Planos.')
            setSubscription(result.data)
            return
          }
          setSubscription(result.data)
          if (result.data.asaas_payment_link) {
            setPlanSuccess('Assinatura criada! Redirecionando para pagamento…')
            window.open(result.data.asaas_payment_link, '_blank')
          } else {
            setPlanSuccess('Assinatura solicitada! Você receberá o link de pagamento por e-mail.')
          }
        } else {
          setPlanError(result.error.message)
        }
      } finally {
        setPendingPlan(null)
      }
    })
  }

  const isTrialing = subscription?.status === 'trialing'

  return (
    <div className="space-y-6">
      {/* Trial banner */}
      {isTrialing && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-900">Você está no período de teste gratuito.</p>
          <p className="mt-1 text-xs text-blue-700">
            Aproveite todos os recursos sem restrições. A cobrança inicia somente após você assinar um plano.
            Renovação e cobrança ficam disponíveis após a ativação.
          </p>
        </div>
      )}

      {/* Error / success feedback */}
      {planError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {planError}
        </div>
      )}
      {planSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm text-green-700">
          {planSuccess}
        </div>
      )}

      {/* Current subscription */}
      {subscription && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Plano atual: {subscription.plan_display}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {subscription.trial_ends_at && subscription.status === 'trialing'
                  ? `Trial até ${new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}`
                  : subscription.current_period_end
                  ? `Renova em ${new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}`
                  : null}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[subscription.status] ?? STATUS_COLORS.canceled}`}>
              {STATUS_LABELS[subscription.status] ?? subscription.status}
            </span>
          </div>
          {subscription.asaas_payment_link && subscription.status !== 'active' && (
            <a
              href={subscription.asaas_payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Pagar agora →
            </a>
          )}
        </div>
      )}

      {/* Billing cycle toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Ciclo:</span>
        <button
          onClick={() => setCycle('monthly')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            cycle === 'monthly' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >Mensal</button>
        <button
          onClick={() => setCycle('yearly')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            cycle === 'yearly' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Anual <span className="ml-1 text-green-600 font-semibold">-16%</span>
        </button>
      </div>

      {/* Plans grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map(plan => {
          const price = cycle === 'yearly' ? plan.yearly : plan.monthly
          const isCurrentPlan = subscription?.plan_name === plan.name
          return (
            <div
              key={plan.name}
              className={`rounded-xl border p-5 space-y-4 ${
                isCurrentPlan ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'
              }`}
            >
              <div>
                <p className="text-base font-bold text-gray-900">{plan.display}</p>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-gray-900">R$ {price.toLocaleString('pt-BR')}</span>
                  <span className="ml-1 text-xs text-gray-400">/{cycle === 'yearly' ? 'ano' : 'mês'}</span>
                </p>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                    <span className="mt-0.5 text-green-500 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              {isCurrentPlan && subscription?.status === 'active' ? (
                <button disabled className="w-full rounded-lg border border-primary/30 bg-primary/10 py-2 text-sm font-semibold text-primary cursor-default select-none">
                  Plano atual ✓
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={pending || pendingPlan === plan.name}
                  className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {pendingPlan === plan.name ? 'Aguarde…' : isCurrentPlan ? 'Renovar' : 'Assinar'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
