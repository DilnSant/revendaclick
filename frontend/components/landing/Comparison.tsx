import { Section, SectionHead, Reveal, IconCheck, IconX } from './ui'

const LINHAS = [
  { criterio: 'Onde ficam os dados', tradicional: 'Planilhas soltas e caderno', rc: 'Uma base única, sempre atualizada' },
  { criterio: 'Atendimento ao cliente', tradicional: 'WhatsApp pessoal, sem histórico', rc: 'Central com histórico por cliente' },
  { criterio: 'Controle de leads', tradicional: 'Ninguém sabe quem responde', rc: 'Funil com dono e etapa definidos' },
  { criterio: 'Vitrine dos veículos', tradicional: 'Publicação manual, uma por uma', rc: 'Site da loja atualizado com o estoque' },
  { criterio: 'Financeiro', tradicional: 'Separado da venda, conferido na mão', rc: 'Amarrado ao veículo e ao vendedor' },
  { criterio: 'Comissões', tradicional: 'Recalculadas todo mês, com divergência', rc: 'Calculadas a partir do negócio fechado' },
  { criterio: 'Indicadores', tradicional: 'Só no fim do mês, se der tempo', rc: 'Painel em tempo real' },
  { criterio: 'Quantidade de sistemas', tradicional: 'Vários, sem conversa entre si', rc: 'Um só, integrado' },
]

export default function Comparison() {
  return (
    <Section>
      <Reveal>
        <SectionHead
          eyebrow="Comparativo"
          title="O jeito de sempre × o jeito que escala"
        />
      </Reveal>

      <Reveal delay={120}>
        {/* Rolagem horizontal isolada — o body nunca rola na horizontal */}
        <div className="mt-14 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <caption className="sr-only">
              Comparação entre o método tradicional de gestão e o RevendaClick
            </caption>
            <thead>
              <tr>
                <th scope="col" className="w-1/3 rounded-tl-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-5 text-left text-sm font-medium text-white/45">
                  &nbsp;
                </th>
                <th scope="col" className="w-1/3 border-y border-white/[0.08] bg-white/[0.02] px-6 py-5 text-left font-heading text-base font-semibold text-white/50">
                  Método tradicional
                </th>
                <th scope="col" className="w-1/3 rounded-tr-2xl border border-primary/25 bg-primary/[0.07] px-6 py-5 text-left font-heading text-base font-semibold text-white">
                  RevendaClick
                </th>
              </tr>
            </thead>
            <tbody>
              {LINHAS.map((l, i) => {
                const last = i === LINHAS.length - 1
                return (
                  <tr key={l.criterio}>
                    <th
                      scope="row"
                      className={`border-x border-b border-white/[0.08] bg-white/[0.02] px-6 py-5 text-left text-sm font-medium text-white/70 ${
                        last ? 'rounded-bl-2xl' : ''
                      }`}
                    >
                      {l.criterio}
                    </th>
                    <td className="border-b border-white/[0.08] bg-white/[0.01] px-6 py-5">
                      <span className="flex items-start gap-2.5 text-sm text-white/40">
                        <IconX className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />
                        {l.tradicional}
                      </span>
                    </td>
                    <td
                      className={`border-x border-b border-primary/25 bg-primary/[0.05] px-6 py-5 ${
                        last ? 'rounded-br-2xl' : ''
                      }`}
                    >
                      <span className="flex items-start gap-2.5 text-sm text-white/85">
                        <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {l.rc}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Reveal>
    </Section>
  )
}
