'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import { setupTenant } from '@/app/onboarding/actions'

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

type Step = 'account' | 'store'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('account')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [account, setAccount] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [store, setStore] = useState({
    tenant_name: '',
    tenant_slug: '',
    phone_whatsapp: '',
  })

  function handleNameChange(v: string) {
    setStore(f => ({ ...f, tenant_name: v, tenant_slug: slugify(v) }))
  }

  function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (account.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (account.password !== account.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    setStep('store')
  }

  function handleStoreSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      // 1. Create Supabase Auth user
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: { full_name: account.name },
        },
      })

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Este email já está cadastrado. Faça login.'
          : authError.message)
        setStep('account')
        return
      }

      if (!authData.session) {
        // Email confirmation required — shouldn't happen with local setup,
        // but handle gracefully.
        router.push('/login?registered=1')
        return
      }

      // 2. Create tenant via backend transaction
      const result = await setupTenant({
        tenant_slug:    store.tenant_slug,
        tenant_name:    store.tenant_name,
        tenant_email:   account.email,
        phone_whatsapp: store.phone_whatsapp,
        user_name:      account.name,
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
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 pt-14 pb-8">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
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
          <h1 className="text-2xl font-heading font-bold text-graphite">
            {step === 'account' ? 'Crie sua conta grátis' : 'Configure sua loja'}
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            {step === 'account'
              ? 'Teste por 30 dias sem cartão de crédito.'
              : 'Última etapa — sua loja estará no ar em segundos.'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {(['account', 'store'] as Step[]).map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
                ${step === s || (s === 'account' && step === 'store')
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-500'}`}>
                {i + 1}
              </div>
              <span className={`text-xs font-medium ${step === s ? 'text-gray-900' : 'text-gray-400'}`}>
                {s === 'account' ? 'Conta' : 'Loja'}
              </span>
              {i === 0 && <div className="flex-1 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Account */}
        {step === 'account' && (
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="label">Nome completo *</label>
                <input
                  value={account.name}
                  onChange={e => setAccount(f => ({ ...f, name: e.target.value }))}
                  required maxLength={120}
                  placeholder="João Silva"
                  className="input"
                />
              </div>
              <div>
                <label className="label">E-mail *</label>
                <input
                  type="email"
                  value={account.email}
                  onChange={e => setAccount(f => ({ ...f, email: e.target.value }))}
                  required
                  placeholder="joao@suarevenda.com.br"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Senha *</label>
                <input
                  type="password"
                  value={account.password}
                  onChange={e => setAccount(f => ({ ...f, password: e.target.value }))}
                  required minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Confirmar senha *</label>
                <input
                  type="password"
                  value={account.confirmPassword}
                  onChange={e => setAccount(f => ({ ...f, confirmPassword: e.target.value }))}
                  required minLength={8}
                  placeholder="Repita a senha"
                  className="input"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full">
                Continuar →
              </button>
            </form>
          </div>
        )}

        {/* Step 2 — Store */}
        {step === 'store' && (
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <form onSubmit={handleStoreSubmit} className="space-y-4">
              <div>
                <label className="label">Nome da loja *</label>
                <input
                  value={store.tenant_name}
                  onChange={e => handleNameChange(e.target.value)}
                  required maxLength={80}
                  placeholder="Revenda do João"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Endereço da loja *</label>
                <div className="flex items-center rounded-lg border border-gray-300 shadow-sm focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 overflow-hidden">
                  <span className="shrink-0 bg-gray-50 px-3 py-2 text-sm text-gray-400 border-r border-gray-300">
                    revendaclick.com.br/
                  </span>
                  <input
                    value={store.tenant_slug}
                    onChange={e => setStore(f => ({ ...f, tenant_slug: slugify(e.target.value) }))}
                    required minLength={3} maxLength={50}
                    pattern="^[a-z0-9][a-z0-9\-]{1,48}[a-z0-9]$"
                    placeholder="revenda-do-joao"
                    className="min-w-0 flex-1 px-3 py-2 text-sm text-gray-900 outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Letras minúsculas, números e hífens.</p>
              </div>

              <div>
                <label className="label">WhatsApp *</label>
                <input
                  type="tel"
                  value={store.phone_whatsapp}
                  onChange={e => setStore(f => ({ ...f, phone_whatsapp: e.target.value }))}
                  required
                  placeholder="(11) 99999-9999"
                  className="input"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep('account'); setError(null) }}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary flex-1"
                >
                  {isPending ? 'Criando…' : 'Criar loja'}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <a href="/login" className="font-medium text-red-600 hover:text-red-700">
            Fazer login
          </a>
        </p>
      </div>
    </div>
  )
}
