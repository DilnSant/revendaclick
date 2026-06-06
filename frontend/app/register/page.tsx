'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin

      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name },
          emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
        },
      })

      if (authError) {
        setError(
          authError.message === 'User already registered'
            ? 'Este email já está cadastrado. Faça login.'
            : authError.message
        )
        return
      }

      // Email confirmation disabled — session available immediately
      if (data.session) {
        window.location.href = '/onboarding'
        return
      }

      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040C21] px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Image src="/logo-dark.png" alt="RevendaClick" width={1536} height={1024}
              className="object-contain h-36 w-auto max-w-full sm:h-48 lg:h-56" priority />
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="text-4xl mb-3">📧</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifique seu email</h2>
            <p className="text-sm text-gray-600">
              Enviamos um link de confirmação para{' '}
              <strong>{form.email}</strong>.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Clique no link para ativar sua conta e configurar sua loja.
            </p>
            <p className="mt-3 text-xs text-gray-400">
              Não encontrou? Verifique também a pasta de <strong>spam</strong> ou <strong>promoções</strong>.
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Enviou para o email errado?{' '}
            <button
              onClick={() => setDone(false)}
              className="text-primary underline hover:text-primary-dark"
            >
              Usar outro email
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#040C21] px-4 pt-10 pb-8">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center">
          <div className="flex justify-center mb-5">
            <Image src="/logo-dark.png" alt="RevendaClick" width={1536} height={1024}
              className="object-contain h-36 w-auto max-w-full sm:h-48 lg:h-56" priority />
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">Crie sua conta grátis</h1>
          <p className="mt-1.5 text-sm text-gray-400">Teste por 30 dias sem cartão de crédito.</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required maxLength={120}
                placeholder="João Silva"
                className="input"
              />
            </div>
            <div>
              <label className="label">E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                placeholder="joao@suarevenda.com.br"
                className="input"
              />
            </div>
            <div>
              <label className="label">Senha *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="input"
              />
            </div>
            <div>
              <label className="label">Confirmar senha *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
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

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
