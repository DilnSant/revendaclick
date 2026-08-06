import { Section, SectionHead, Reveal, IconStar } from './ui'

/* ═══════════════════════════════════════════════════════════════════════
 * ⚠️  CONTEÚDO FICTÍCIO — NÃO SÃO CLIENTES REAIS
 *
 * Nomes, cidades, números e frases abaixo foram inventados a pedido, para
 * a seção existir visualmente. Nenhuma dessas pessoas existe.
 *
 * ANTES DE PUBLICAR: substitua por depoimentos reais, com autorização por
 * escrito de cada cliente. Veicular depoimento inventado como se fosse de
 * cliente real é publicidade enganosa (CDC, art. 37) e expõe a empresa a
 * sanção do Procon e a ação por parte de concorrentes.
 *
 * Se ainda não houver clientes para citar, remova <Testimonials /> de
 * app/page.tsx — a landing funciona sem esta seção.
 * ═══════════════════════════════════════════════════════════════════════ */
const DEPOIMENTOS_FICTICIOS = [
  {
    nome: 'Ricardo Almeida',
    loja: 'Almeida Multimarcas',
    cidade: 'Campinas, SP',
    iniciais: 'RA',
    metrica: '38 veículos vendidos no último trimestre',
    texto:
      'O que mais mudou foi parar de perder contato. Antes chegava mensagem no WhatsApp de três pessoas diferentes e ninguém sabia quem ia responder. Hoje cada lead tem dono e prazo.',
  },
  {
    nome: 'Patrícia Moreira',
    loja: 'PM Seminovos',
    cidade: 'Londrina, PR',
    iniciais: 'PM',
    metrica: '25 veículos vendidos no último trimestre',
    texto:
      'Eu montava planilha de comissão no fim de todo mês e sempre dava divergência com os vendedores. Agora sai do próprio sistema, amarrado na venda. Acabou a discussão.',
  },
  {
    nome: 'Wagner Teixeira',
    loja: 'Teixeira Automóveis',
    cidade: 'Goiânia, GO',
    iniciais: 'WT',
    metrica: '52 veículos vendidos no último trimestre',
    texto:
      'Descobri que tinha carro parado há mais de cem dias que eu jurava ser recente. Só de enxergar isso no painel eu já girei três unidades que estavam travando capital.',
  },
]

export default function Testimonials() {
  return (
    <Section>
      <Reveal>
        <SectionHead
          eyebrow="Quem usa"
          title="Lojistas que trocaram o improviso pelo processo"
        />
      </Reveal>

      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        {DEPOIMENTOS_FICTICIOS.map((d, i) => (
          <Reveal key={d.nome} delay={i * 90}>
            <figure className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 transition-colors duration-300 hover:border-white/[0.14]">
              <div className="flex gap-0.5 text-primary" aria-label="Avaliação 5 de 5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <IconStar key={s} className="h-4 w-4 fill-current" />
                ))}
              </div>

              <blockquote className="mt-5 flex-1">
                <p className="text-sm leading-relaxed text-white/75">&ldquo;{d.texto}&rdquo;</p>
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-white/[0.07] pt-5">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.06] font-heading text-sm font-semibold text-white/70"
                >
                  {d.iniciais}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{d.nome}</p>
                  <p className="truncate text-xs text-white/45">
                    {d.loja} · {d.cidade}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-primary/70">{d.metrica}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
