# FC024 — Vehicle Detail HTTP 500 (features null + photo_urls→images)

**Data:** 2026-05-27  
**Sessão:** 13  
**Commit:** `2ee68ab`  
**Severidade:** Crítica (página pública retornava 500)

---

## Sintoma

Página de detalhe de veículo (`/[slug]/[vehicleSlug]`) retornava HTTP 500 com código de erro `4250320451`.

```
https://www.revendaclick.com.br/santos-car/ford-fiesta-2014-2015
→ 500 "Algo deu errado. Código: 4250320451"
```

---

## Causa Raiz

Dois bugs no mesmo componente `frontend/app/(public)/[slug]/[vehicleSlug]/page.tsx`:

**Bug A — `features: string[]` mas backend retorna `null`:**
- Go retorna `null` para slice nil no JSON
- TypeScript tipava como `string[]` (nunca null)
- `vehicle.features.length` explodiu com `TypeError: Cannot read properties of null`

**Bug B — campo `photo_urls` não existe no backend:**
- Backend retorna `images: string[]`
- Frontend usava `vehicle.photo_urls` → sempre `undefined`
- Galeria de fotos nunca exibia imagens

---

## Correção

```tsx
// Antes
features: string[]
photo_urls: string[]

// Depois
features: string[] | null
images: string[] | null

// Guards adicionados
{(vehicle.features ?? []).length > 0 && ( ... )}
{(vehicle.features ?? []).map((f) => ( ... ))}
{(vehicle.images ?? []).length > 1 && ( ... )}
{(vehicle.images ?? []).slice(0, 8).map((url, i) => ( ... ))}
```

---

## Prevenção

- Tipos do frontend devem ser gerados a partir do backend Go (ou pelo menos validados contra o JSON real)
- Slices Go: nil slice serializa para `null` no JSON — sempre usar `| null` no TypeScript quando o campo pode ser nil no Go
- Validar com `curl` o endpoint do backend antes de assumir o formato do campo
