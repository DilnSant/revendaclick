export default function WhySection() {
  return (
    <section className="bg-gray-50 py-24" aria-labelledby="why-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Por que escolher
          </p>
          <h2
            id="why-heading"
            className="font-heading text-3xl font-bold text-graphite sm:text-4xl"
          >
            Por que escolher o RevendaClick?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Compare e entenda por que centenas de revendas deixaram planilhas e
            marketplaces caros para trás.
          </p>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-gray-100">
            <div className="p-6 text-center">
              <p className="font-heading text-sm font-bold text-gray-400">Sem sistema</p>
              <p className="mt-1 text-xs text-gray-400">(planilhas e papel)</p>
            </div>
            <div className="bg-graphite p-6 text-center">
              <p className="font-heading text-sm font-bold text-white">RevendaClick</p>
              <p className="mt-1 text-xs text-primary-light">A escolha certa</p>
            </div>
            <div className="p-6 text-center">
              <p className="font-heading text-sm font-bold text-gray-400">Marketplace caro</p>
              <p className="mt-1 text-xs text-gray-400">(OLX, iCarros, etc.)</p>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-b border-gray-50 ${
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              <Cell value={row.without} type="bad" />
              <Cell value={row.with} type="good" dark />
              <Cell value={row.marketplace} type={row.marketplaceType} />
            </div>
          ))}

          {/* Feature label column overlay */}
        </div>

        {/* Feature labels */}
        <div className="mx-auto mt-4 max-w-5xl">
          <div className="grid gap-2">
            {ROWS.map((row) => (
              <div key={row.feature} className="flex items-center gap-2 px-1">
                <span className="text-xs text-gray-400">{row.feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alternative layout — feature-by-feature cards */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-2">
          {DIFFERENTIALS.map((d) => (
            <article
              key={d.title}
              className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10" aria-hidden>
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={d.icon} />
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-graphite">{d.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{d.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

type CellType = 'good' | 'bad' | 'neutral'

function Cell({ value, type, dark }: { value: string; type: CellType; dark?: boolean }) {
  const iconColor =
    type === 'good' ? 'text-green-500' : type === 'bad' ? 'text-red-400' : 'text-yellow-500'
  const iconPath =
    type === 'good'
      ? 'M5 13l4 4L19 7'
      : type === 'bad'
      ? 'M6 18L18 6M6 6l12 12'
      : 'M20 12H4'

  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 p-4 ${dark ? 'bg-graphite' : ''}`}>
      <svg
        className={`h-4 w-4 ${iconColor}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
      <span className={`text-center text-xs leading-tight ${dark ? 'text-gray-300' : 'text-gray-500'}`}>
        {value}
      </span>
    </div>
  )
}

const ROWS = [
  {
    feature: 'Gestão de estoque',
    without: 'Planilha manual',
    with: 'Automático e em tempo real',
    marketplace: 'Apenas anúncios',
    marketplaceType: 'bad' as CellType,
  },
  {
    feature: 'Leads e CRM',
    without: 'Caderno ou WhatsApp pessoal',
    with: 'CRM completo com kanban',
    marketplace: 'Leads genéricos pagos',
    marketplaceType: 'neutral' as CellType,
  },
  {
    feature: 'Custo por lead',
    without: 'Zero (mas ineficiente)',
    with: 'Plano fixo, sem comissão',
    marketplace: 'Comissão por lead/venda',
    marketplaceType: 'bad' as CellType,
  },
  {
    feature: 'Dados dos compradores',
    without: 'Você não tem controle',
    with: 'Seus dados, para sempre',
    marketplace: 'Pertence ao marketplace',
    marketplaceType: 'bad' as CellType,
  },
  {
    feature: 'WhatsApp integrado',
    without: 'WhatsApp pessoal desorganizado',
    with: 'Central integrada com IA',
    marketplace: 'Não incluso',
    marketplaceType: 'bad' as CellType,
  },
]

const DIFFERENTIALS = [
  {
    title: 'Seus dados são seus',
    desc: 'Todos os leads, clientes e histórico pertencem a você. Nunca ao marketplace.',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    title: 'Plano fixo, sem surpresas',
    desc: 'Sem comissão por venda, sem custo variável. Pague um valor fixo e venda à vontade.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Multi-canal em um clique',
    desc: 'Publique no WhatsApp, Instagram e Facebook sem copiar um link sequer.',
    icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z',
  },
  {
    title: 'Configurado em 30 minutos',
    desc: 'Sem instalação, sem servidor, sem TI. Acesse pelo celular ou computador agora.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
]
