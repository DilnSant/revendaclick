# FC025 — Logos Bucket: Policy Pública Desnecessária

**Data:** 2026-05-27  
**Sessão:** 13  
**Migration:** 015 (drop logos_public_read)  
**Severidade:** Baixa (advisory warning)

---

## Sintoma

Supabase Security Advisor reportou `public_bucket_allows_listing` para o bucket `logos`.

---

## Causa Raiz

Migration 014 criou uma RLS policy `logos_public_read` com:
```sql
CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'logos');
```

Um bucket marcado como `public=true` no Supabase já serve arquivos via URL pública sem necessitar de policy SELECT explícita. A policy criada era redundante e, pior, permitia que qualquer usuário **listasse todos os arquivos** do bucket (não apenas acessá-los por URL).

---

## Correção

Removida na migration 015:
```sql
DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
```

O acesso via URL pública (`getPublicUrl`) continua funcionando — o bucket `public=true` garante isso sem policy adicional.

---

## Prevenção

- Buckets `public=true`: não criar policy SELECT explícita — o acesso por URL já é garantido
- Policy SELECT em storage só é necessária para buckets **privados** com acesso granular
- Bucket público + policy SELECT = permite listing (expõe estrutura de arquivos de todos os tenants)
