# FC067 — Canonical apontando para host que responde 307, divergente do sitemap

**Área:** Frontend / SEO / Marketing
**Severidade:** MÉDIA
**Data:** 07/08/2026
**Sessão:** 64

---

## Sintoma

As páginas de marketing declaravam `rel="canonical"` para `https://revendaclick.com.br/<rota>`,
uma URL que **nunca responde 200**. O sitemap, no mesmo deploy, declarava
`https://app.revendaclick.com.br/<rota>`.

Resultado: o buscador recebia duas URLs diferentes para a mesma página, e a do canonical o levava a
uma cadeia de dois redirects até a outra.

```
revendaclick.com.br --307--> www.revendaclick.com.br --308--> app.revendaclick.com.br --> 200
       (redirect no painel da Vercel)      (next.config.ts:41-48, fix do FC058)
```

Somado a isso, as 6 landings segmentadas criadas no D38 **não estavam no sitemap** — `sitemap.ts`
tinha lista estática com apenas `/`, `/privacidade`, `/terms` e as vitrines dos tenants.

Nenhum sintoma visível ao usuário: as páginas abriam normalmente. O prejuízo era só de indexação.

---

## Causa Raiz

**O host do site estava escrito à mão em 6 arquivos, com 2 valores diferentes.**

| Arquivo | Valor declarado |
|---|---|
| `app/page.tsx` | `https://revendaclick.com.br` (literal) |
| `components/landing/segments/SegmentPage.tsx` | `https://revendaclick.com.br` (literal) |
| `app/privacidade/page.tsx` | `https://revendaclick.com.br/privacidade` (literal) |
| `app/layout.tsx` | `NEXT_PUBLIC_APP_URL` ?? `https://revendaclick.com.br` |
| `app/sitemap.ts` | `NEXT_PUBLIC_APP_URL` ?? `https://revendaclick.com.br` |
| `app/robots.ts` | `NEXT_PUBLIC_APP_URL` ?? `https://revendaclick.com.br` |

Em produção `NEXT_PUBLIC_APP_URL` está definida como `https://app.revendaclick.com.br`. Então os
arquivos que liam a env resolviam para `app.`, e os que tinham literal ficavam no apex — divergência
garantida, sem ninguém ter errado nada individualmente.

**O defeito é anterior às landings novas.** `app/privacidade/page.tsx` já tinha canonical literal
para o apex desde antes; o D38 apenas multiplicou o problema por 6 rotas novas e o tornou visível.

---

## Arquivos Afetados

`frontend/lib/site.ts` (novo), `frontend/app/page.tsx`, `frontend/app/layout.tsx`,
`frontend/app/sitemap.ts`, `frontend/app/robots.ts`, `frontend/app/privacidade/page.tsx`,
`frontend/components/landing/segments/SegmentPage.tsx`.

---

## Banco / Migrations

Nenhuma alteração de banco.

---

## Correção Aplicada

1. **Fonte única do host:** criado `frontend/lib/site.ts` exportando `SITE_URL`, derivado de
   `NEXT_PUBLIC_APP_URL` com fallback `https://app.revendaclick.com.br` (o host correto, não mais o
   apex). Os 6 arquivos passaram a consumi-lo; **nenhum host literal restou nos metadados**.
2. **Sitemap derivado dos dados:** as rotas segmentadas passaram a ser geradas de
   `Object.values(SEGMENTOS)` em vez de lista paralela. Adicionar um segmento em
   `segments/data.ts` já o inclui no sitemap.

Decisão de qual host canonizar registrada em **D39** — `app.` foi escolhido porque marketing e
dashboard vivem no mesmo app Next.js; servir marketing no apex desfaria o redirect do FC058.

---

## Commit(s)

```
6a23bd6 fix(seo): canonizar em app.revendaclick.com.br e derivar sitemap de SEGMENTOS
9ca4d1b docs(D39): registrar deploy do canonical e verificação em produção
```

CI/CD run `31140613457` ✓.

---

## Como Validar

```bash
# 1. Nenhum host literal nos metadados (só lib/site.ts pode definir)
grep -rn "https://revendaclick.com.br" frontend/app frontend/components --include="*.tsx" --include="*.ts"
# Ocorrências aceitáveis: link de marca no footer da vitrine e fallback do Meta CAPI.
# NENHUMA pode estar em canonical, metadataBase, sitemap ou robots.

# 2. Toda URL canônica responde 200 sem redirect
for p in "" /revendas-pequenas /multimarcas /premium /crm-automotivo /erp-automotivo \
         /site-para-revendas /privacidade; do
  curl -s -o /dev/null -w "$p HTTP %{http_code} redirects=%{num_redirects}\n" \
    "https://app.revendaclick.com.br$p"
done

# 3. Canonical e sitemap concordam
curl -s https://app.revendaclick.com.br/sitemap.xml | grep -oE "<loc>[^<]+</loc>"
```

---

## Resultado Final

Verificado em produção após o deploy:

| Verificação | Resultado |
|---|---|
| 8 URLs canônicas | HTTP 200, **0 redirects** |
| Canonical × sitemap | concordam em todas as rotas |
| 6 landings segmentadas no sitemap | presentes |
| `robots.txt` | aponta para `https://app.revendaclick.com.br/sitemap.xml` |

---

## Risco de Regressão

**Médio.** Nada impede escrever host literal num arquivo novo de metadata. O erro é silencioso — a
página funciona, só indexa errado, e ninguém percebe sem inspecionar o HTML servido.

Se `NEXT_PUBLIC_APP_URL` for removida da Vercel, o fallback de `lib/site.ts` mantém
`app.revendaclick.com.br` — o valor correto. Antes desta correção, o fallback levava ao apex.

---

## Prevenção

1. **Nunca escrever o host literalmente.** Importar `SITE_URL` de `@/lib/site`.
2. Ao criar página com `alternates.canonical` ou `metadataBase`, conferir que a URL declarada
   responde 200 sem redirect — não basta abrir no browser, que segue o redirect em silêncio.
3. Preferir derivar listas de rota dos dados (como o sitemap agora faz com `SEGMENTOS`) em vez de
   manter listas paralelas.

---

## Relacionados

- **D38** — landings segmentadas que expuseram o defeito.
- **D39** — decisão de canonizar em `app.`.
- **FC058** — origem do redirect `www` → `app`, que criou a cadeia.
