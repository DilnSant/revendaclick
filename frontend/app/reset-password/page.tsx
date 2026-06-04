'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase appends the token as a hash fragment (#access_token=...).
    // The client SDK handles it automatically on load — just confirm the session exists.
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
  }, [searchParams])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      router.push('/dashboard')
      router.refresh()
    })
  }

  if (!ready) {
    return (
      <p className="text-sm text-gray-500 text-center animate-pulse">Validando link…</p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nova senha</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="input"
        />
      </div>
      <div>
        <label className="label">Confirmar nova senha</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required minLength={8}
          placeholder="Repita a senha"
          className="input"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? 'Salvando…' : 'Definir nova senha'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-graphite px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image src="/logo-dark.png" alt="RevendaClick" width={1536} height={1024}
              style={{ height: '80px', width: 'auto' }} className="object-contain" priority />
          </div>
          <h1 className="text-xl font-bold text-white">Nova senha</h1>
          <p className="mt-1 text-sm text-gray-400">Escolha uma senha segura para sua conta.</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-gray-400 text-center">Carregando…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
