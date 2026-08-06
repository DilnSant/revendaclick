import { Reveal } from './ui'

/* ═══════════════════════════════════════════════════════════════════════
 * ⚠️  NÚMEROS FICTÍCIOS — NÃO REFLETEM A BASE REAL
 *
 * Valores de exemplo, criados a pedido para a seção existir visualmente.
 * A base atual não sustenta nenhum destes números.
 *
 * ANTES DE PUBLICAR: substitua por métricas reais e verificáveis, ou
 * remova <Metrics /> de app/page.tsx. Número inflado em material de
 * divulgação é publicidade enganosa (CDC, art. 37) — e é o primeiro
 * argumento que um concorrente usa contra você.
 * ═══════════════════════════════════════════════════════════════════════ */
const INDICADORES_FICTICIOS = [
  { valor: '2.400+', label: 'veículos cadastrados' },
  { valor: '18 mil+', label: 'leads gerenciados' },
  { valor: '6.100+', label: 'negociações acompanhadas' },
  { valor: '9 h', label: 'economizadas por semana' },
]

export default function Metrics() {
  return (
    <section aria-label="Indicadores da plataforma" className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {INDICADORES_FICTICIOS.map((m) => (
              <div key={m.label} className="bg-[#07080B] px-6 py-9 text-center">
                <dt className="sr-only">{m.label}</dt>
                <dd>
                  <span className="block font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    {m.valor}
                  </span>
                  <span className="mt-2 block text-sm text-white/45">{m.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
