'use client'

import Link from 'next/link'
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (error.message === 'Email not confirmed') {
          setError('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.')
        } else {
          setError('Email ou senha inválidos.')
        }
        return
      }

      const role = data.user?.app_metadata?.user_role as string | undefined
      const destination = role === 'super_admin' ? '/admin' : redirect
      router.push(destination)
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Logo */}
      <div className="flex justify-center">
        <Image
          src="/logo-dark.png"
          alt="RevendaClick"
          width={1536}
          height={1024}
          className="object-contain h-36 w-auto max-w-full sm:h-48 lg:h-56"
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
              <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-dark font-medium transition-colors">
                Esqueci minha senha
              </Link>
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

      <p className="text-center text-sm text-gray-400">
        Não tem conta?{' '}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-dark transition-colors">
          Criar gratuitamente
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#010F21] px-4">
      <Suspense fallback={<div className="w-full max-w-sm" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
