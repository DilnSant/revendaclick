'use client'

interface Row {
  type: string
  category: string
  description: string
  amount: number
  status: string
  due_date?: string
  paid_at?: string
}

interface Props {
  entries: Row[]
  filename?: string
}

function escapeCSV(v: string | number | undefined) {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const TYPE_LABEL: Record<string, string> = { income: 'Entrada', expense: 'Saída' }
const STATUS_LABEL: Record<string, string> = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido' }

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function ExportCSVButton({ entries, filename = 'financeiro' }: Props) {
  function handleExport() {
    const headers = ['Tipo', 'Categoria', 'Descrição', 'Valor (R$)', 'Status', 'Vencimento', 'Pago em']
    const rows = entries.map(e => [
      TYPE_LABEL[e.type] ?? e.type,
      e.category,
      e.description,
      fmt(e.amount),
      STATUS_LABEL[e.status] ?? e.status,
      fmtDate(e.due_date),
      fmtDate(e.paid_at),
    ].map(escapeCSV).join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="btn-secondary shrink-0 flex items-center gap-1.5"
      title="Exportar lançamentos como CSV"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Exportar CSV
    </button>
  )
}
