/**
 * Host canônico do site público — fonte ÚNICA.
 *
 * Marketing e dashboard vivem no mesmo app Next.js. O apex e o `www` redirecionam
 * para `app.`:
 *
 *   revendaclick.com.br --307--> www.revendaclick.com.br --308--> app.revendaclick.com.br
 *          (redirect no painel da Vercel)        (next.config.ts, fix do FC058)
 *
 * Por isso o canonical precisa apontar para `app.` — é o único host que responde 200.
 * Canonizar em qualquer outro faz o buscador seguir uma cadeia de redirects até uma
 * URL diferente da declarada, que foi exatamente o defeito corrigido em D39.
 *
 * Nunca redefinir esta constante localmente em outro arquivo: sitemap, robots e as
 * páginas de marketing precisam concordar sobre o mesmo host.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.revendaclick.com.br'
).replace(/\/+$/, '')
