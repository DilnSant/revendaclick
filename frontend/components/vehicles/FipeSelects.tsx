'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface FipeItem { codigo: string; nome: string }

interface Props {
  brand: string
  model: string
  version: string
  onBrandChange: (name: string) => void
  onModelChange: (name: string) => void
  onVersionChange: (nome: string) => void
  onFipePrice?: (price: number) => void
}

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

interface SearchSelectProps {
  label: string
  required?: boolean
  value: string
  options: FipeItem[]
  loading: boolean
  disabled?: boolean
  placeholder: string
  onChange: (nome: string, codigo: string) => void
}

function SearchSelect({ label, required, value, options, loading, disabled, placeholder, onChange }: SearchSelectProps) {
  const [prevValue, setPrevValue] = useState(value)
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 200)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync query from prop using rendering-phase update (avoids extra effect)
  if (prevValue !== value) {
    setPrevValue(value)
    setQuery(value)
  }

  const filtered = debouncedQuery.length < 1
    ? options
    : options.filter(o => o.nome.toLowerCase().includes(debouncedQuery.toLowerCase()))

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(value)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [value])

  function handleSelect(item: FipeItem) {
    setQuery(item.nome)
    setOpen(false)
    onChange(item.nome, item.codigo)
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder={loading ? 'Carregando…' : placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="input pr-8 disabled:bg-gray-50 disabled:text-gray-400"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      {open && !loading && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
          {filtered.slice(0, 60).map((item) => (
            <li
              key={item.codigo}
              onMouseDown={() => handleSelect(item)}
              className={`cursor-pointer px-3 py-2 hover:bg-primary/10 hover:text-primary ${
                item.nome === value ? 'bg-primary/10 font-medium text-primary' : 'text-gray-700'
              }`}
            >
              {item.nome}
            </li>
          ))}
          {filtered.length > 60 && (
            <li className="px-3 py-2 text-xs text-gray-400">
              Refine a busca ({filtered.length} resultados)
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

export default function FipeSelects({
  brand, model, version,
  onBrandChange, onModelChange, onVersionChange, onFipePrice,
}: Props) {
  const [brands, setBrands] = useState<FipeItem[]>([])
  const [models, setModels] = useState<FipeItem[]>([])
  const [versions, setVersions] = useState<FipeItem[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [selectedBrandCode, setSelectedBrandCode] = useState<string | null>(null)
  const [selectedModelCode, setSelectedModelCode] = useState<string | null>(null)
  const initialBrandLoadedRef = useRef(false)
  const initialModelLoadedRef = useRef(false)

  // Declarations before effects that reference them
  const loadModels = useCallback((brandCode: string) => {
    setModels([])
    setVersions([])
    setLoadingModels(true)
    fetch(`/api/fipe/models?brand=${brandCode}`)
      .then(r => r.json())
      .then((data: FipeItem[]) => setModels(Array.isArray(data) ? data : []))
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false))
  }, [])

  const loadVersions = useCallback((brandCode: string, modelCode: string) => {
    setVersions([])
    setLoadingVersions(true)
    fetch(`/api/fipe/versions?brand=${brandCode}&model=${modelCode}`)
      .then(r => r.json())
      .then((data: FipeItem[]) => setVersions(Array.isArray(data) ? data : []))
      .catch(() => setVersions([]))
      .finally(() => setLoadingVersions(false))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingBrands(true)
    fetch('/api/fipe/brands')
      .then(r => r.json())
      .then((data: FipeItem[]) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]))
      .finally(() => setLoadingBrands(false))
  }, [])

  // Edit mode: resolve brand code when brands load
  useEffect(() => {
    if (initialBrandLoadedRef.current) return
    if (!brand || brands.length === 0) return
    const match = brands.find(b => b.nome.toLowerCase() === brand.toLowerCase())
    if (!match) return
    initialBrandLoadedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedBrandCode(match.codigo)
    loadModels(match.codigo)
  }, [brand, brands, loadModels])

  // Edit mode: resolve model code when models load
  useEffect(() => {
    if (initialModelLoadedRef.current) return
    if (!model || models.length === 0 || !selectedBrandCode) return
    const match = models.find(m => m.nome.toLowerCase() === model.toLowerCase())
    if (!match) return
    initialModelLoadedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedModelCode(match.codigo)
    loadVersions(selectedBrandCode, match.codigo)
  }, [model, models, selectedBrandCode, loadVersions])

  async function fetchFipePrice(brandCode: string, modelCode: string, versionCode: string) {
    if (!onFipePrice) return
    try {
      const res = await fetch(
        `https://parallelum.com.br/fipe/api/v1/carros/marcas/${brandCode}/modelos/${modelCode}/anos/${versionCode}`,
      )
      if (!res.ok) return
      const data = await res.json()
      const raw: string = data.Valor ?? ''
      const num = parseFloat(raw.replace(/[^0-9,]/g, '').replace(',', '.'))
      if (!isNaN(num) && num > 0) onFipePrice(num)
    } catch { /* ignore */ }
  }

  function handleBrandSelect(nome: string, codigo: string) {
    setSelectedBrandCode(codigo)
    setSelectedModelCode(null)
    initialModelLoadedRef.current = false
    onBrandChange(nome)
    onModelChange('')
    onVersionChange('')
    loadModels(codigo)
  }

  function handleModelSelect(nome: string, codigo: string) {
    setSelectedModelCode(codigo)
    onModelChange(nome)
    onVersionChange('')
    if (selectedBrandCode) loadVersions(selectedBrandCode, codigo)
  }

  function handleVersionSelect(nome: string, codigo: string) {
    onVersionChange(nome)
    if (selectedBrandCode && selectedModelCode) {
      fetchFipePrice(selectedBrandCode, selectedModelCode, codigo)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <SearchSelect
          label="Marca"
          required
          value={brand}
          options={brands}
          loading={loadingBrands}
          placeholder="Ex: Honda"
          onChange={handleBrandSelect}
        />
        <SearchSelect
          label="Modelo"
          required
          value={model}
          options={models}
          loading={loadingModels}
          disabled={!selectedBrandCode && models.length === 0}
          placeholder={selectedBrandCode ? 'Ex: Civic' : 'Selecione a marca primeiro'}
          onChange={handleModelSelect}
        />
      </div>
      <SearchSelect
        label="Versão / Ano-Combustível (FIPE)"
        value={version}
        options={versions}
        loading={loadingVersions}
        disabled={!selectedModelCode && versions.length === 0}
        placeholder={selectedModelCode ? 'Selecione a versão' : 'Selecione o modelo primeiro'}
        onChange={handleVersionSelect}
      />
      {onFipePrice && versions.length > 0 && (
        <p className="text-[10px] text-gray-400">
          Selecionar a versão preenche automaticamente o Preço FIPE.
        </p>
      )}
    </div>
  )
}
