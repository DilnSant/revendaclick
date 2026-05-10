'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { setupTenant } from './actions'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

export default function OnboardingPage() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    tenant_name: '',
    tenant_slug: '',
    tenant_email: '',
    phone_whatsapp: '',
    user_name: '',
  })

  function handleNameChange(v: string) {
    setForm(f => ({
      ...f,
      tenant_name: v,
      tenant_slug: slugify(v),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await setupTenant({
        tenant_slug:    form.tenant_slug,
        tenant_name:    form.tenant_name,
        tenant_email:   form.tenant_email,
        phone_whatsapp: form.phone_whatsapp,
        user_name:      form.user_name,
      })

      if (result.error) {
        setError(result.error.message)
        return
      }

      router.push('/dashboard')
      router.refresh()
    })
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 pt-16 pb-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <Image
              src="/logo.png"
              alt="RevendaClick"
              width={870}
              height={592}
              style={{ height: '140px', width: 'auto' }}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-heading font-bold text-graphite">Configure sua loja</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Sua vitrine online estará no ar em minutos.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User name */}
            <div>
              <label className="label">Seu nome completo *</label>
              <input
                value={form.user_name}
                onChange={e => setForm(f => ({ ...f, user_name: e.target.value }))}
                required
                maxLength={120}
                placeholder="João Silva"
                className="input"
              />
            </div>

            {/* Store name */}
            <div>
              <label className="label">Nome da loja *</label>
              <input
                value={form.tenant_name}
                onChange={e => handleNameChange(e.target.value)}
                required
                maxLength={80}
                placeholder="Revenda do João"
                className="input"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="label">Endereço da loja *</label>
              <div className="flex items-center rounded-lg border border-gray-300 shadow-sm focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 overflow-hidden">
                <span className="shrink-0 bg-gray-50 px-3 py-2 text-sm text-gray-400 border-r border-gray-300">
                  revendaclick.com.br/
                </span>
                <input
                  value={form.tenant_slug}
                  onChange={e => setForm(f => ({ ...f, tenant_slug: slugify(e.target.value) }))}
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$"
                  placeholder="revenda-do-joao"
                  className="min-w-0 flex-1 px-3 py-2 text-sm text-gray-900 outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Apenas letras minúsculas, números e hífens. Mínimo 3 caracteres.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="label">E-mail da loja *</label>
              <input
                type="email"
                value={form.tenant_email}
                onChange={e => setForm(f => ({ ...f, tenant_email: e.target.value }))}
                required
                placeholder="contato@sujarevenda.com.br"
                className="input"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="label">WhatsApp *</label>
              <input
                type="tel"
                value={form.phone_whatsapp}
                onChange={e => setForm(f => ({ ...f, phone_whatsapp: e.target.value }))}
                required
                placeholder="(11) 99999-9999"
                className="input"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full"
            >
              {pending ? 'Criando sua loja…' : 'Criar loja e entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400">
          Ao criar sua loja você concorda com os{' '}
          <a href="#" className="underline hover:text-gray-600">Termos de Uso</a>.
        </p>
      </div>
    </div>
  )
}
