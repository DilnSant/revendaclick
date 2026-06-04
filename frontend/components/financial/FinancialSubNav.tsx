type Tab = 'resumo' | 'vendas' | 'comissoes'

const TABS: { key: Tab; label: string; href: string }[] = [
  { key: 'resumo',    label: 'Resumo',    href: '/financial' },
  { key: 'vendas',    label: 'Vendas',    href: '/sales' },
  { key: 'comissoes', label: 'Comissões', href: '/financial/commissions' },
]

export default function FinancialSubNav({ active }: { active: Tab }) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex gap-1">
        {TABS.map(t => (
          <a
            key={t.key}
            href={t.href}
            className={`px-4 pb-3 text-sm font-medium border-b-2 transition-colors ${
              active === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
