'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

// Isolated in its own component so <Suspense> can boundary useSearchParams()
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'
  const registered = searchParams.get('registered') === '1'
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError('Email ou senha inválidos.')
        return
      }

      router.push(redirect)
      router.refresh()
    })
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-xl font-bold text-gray-900">Entrar no RevendaClick</h1>
      <p className="mt-1 text-sm text-gray-500">Acesse seu painel de vendas</p>

      {registered && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5 text-sm text-green-700">
          Conta criada! Confirme seu email para entrar.
        </div>
      )}
      {authError === 'auth_callback_failed' && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
          Link inválido ou expirado. Solicite um novo.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

        <div className="flex items-center justify-between">
          <span />
          <a href="/forgot-password" className="text-xs text-red-600 hover:text-red-700">
            Esqueci minha senha
          </a>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full"
        >
          {isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Não tem conta?{' '}
        <a href="/register" className="font-medium text-red-600 hover:text-red-700">
          Criar gratuitamente
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="w-full max-w-sm p-8" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
