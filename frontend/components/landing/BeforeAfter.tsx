import { Section, SectionHead, Reveal, IconCheck, IconX } from './ui'

const ANTES = [
  'Planilhas que ninguém atualiza',
  'WhatsApp perdido entre conversas',
  'Anúncios publicados manualmente',
  'Financeiro bagunçado no caderno',
  'Nenhum indicador confiável',
  'Cada setor com seu próprio controle',
]

const DEPOIS = [
  'Tudo integrado em uma plataforma',
  'CRM com histórico de cada cliente',
  'Estoque e vitrine sempre atualizados',
  'Financeiro e comissões organizados',
  'Indicadores em tempo real',
  'A loja inteira falando a mesma língua',
]

export default function BeforeAfter() {
  return (
    <Section>
      <Reveal>
        <SectionHead
          eyebrow="A virada"
          title={
            <>
              O que muda quando a loja para de
              <br className="hidden sm:block" /> funcionar no improviso
            </>
          }
        />
      </Reveal>

      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/40">
                <IconX className="h-4 w-4" />
              </span>
              <h3 className="font-heading text-xl font-semibold text-white/45">Antes</h3>
            </div>
            <ul className="mt-7 space-y-3.5">
              {ANTES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/45">
                  <IconX className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
                  <span className="text-sm leading-relaxed line-through decoration-white/20">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative h-full overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.09] to-white/[0.02] p-7">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-[70px]"
            />
            <div className="relative flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <IconCheck className="h-4 w-4" />
              </span>
              <h3 className="font-heading text-xl font-semibold text-white">
                Depois do RevendaClick
              </h3>
            </div>
            <ul className="relative mt-7 space-y-3.5">
              {DEPOIS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm leading-relaxed text-white/85">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
