'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'

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
    <div className="w-full max-w-sm space-y-6">
      {/* Logo */}
      <div className="flex justify-center">
        <Image
          src="/logo.png"
          alt="RevendaClick"
          width={180}
          height={48}
          className="h-11 w-auto object-contain"
          priority
        />
      </div>

      <div className="card p-8">
        <div className="mb-6">
          <h1 className="text-xl font-heading font-bold text-graphite">Entrar na plataforma</h1>
          <p className="mt-1 text-sm text-gray-500">Acesse seu painel de vendas</p>
        </div>

        {registered && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5 text-sm text-green-700">
            Conta criada! Confirme seu email para entrar.
          </div>
        )}
        {authError === 'auth_callback_failed' && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            Link inválido ou expirado. Solicite um novo.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              placeholder="seu@email.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0" htmlFor="password">Senha</label>
              <a href="/forgot-password" className="text-xs text-primary hover:text-primary-dark font-medium transition-colors">
                Esqueci minha senha
              </a>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full mt-2"
          >
            {isPending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500">
        Não tem conta?{' '}
        <a href="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">
          Criar gratuitamente
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="w-full max-w-sm" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
