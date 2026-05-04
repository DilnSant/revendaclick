'use client'

import { useEffect } from 'react'

export type ToastMessage = {
  id: number
  type: 'success' | 'error'
  text: string
}

interface Props {
  toasts: ToastMessage[]
  onDismiss: (id: number) => void
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const isSuccess = toast.type === 'success'

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium
        animate-in slide-in-from-bottom-2 duration-200
        ${isSuccess ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
    >
      <span>{isSuccess ? '✓' : '✕'}</span>
      <span>{toast.text}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  )
}
