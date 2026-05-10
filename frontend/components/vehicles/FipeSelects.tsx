'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface FipeItem { codigo: string; nome: string }

interface Props {
  brand: string
  model: string
  onBrandChange: (name: string) => void
  onModelChange: (name: string) => void
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
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 200)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync external value changes (e.g. form reset)
  useEffect(() => { setQuery(value) }, [value])

  const filtered = debouncedQuery.length < 1
    ? options
    : options.filter(o => o.nome.toLowerCase().includes(debouncedQuery.toLowerCase()))

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        // Reset to last valid value
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
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
          </div>
        )}
      </div>
      {open && !loading && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
          {filtered.slice(0, 60).map((item) => (
            <li
              key={item.codigo}
              onMouseDown={() => handleSelect(item)}
              className={`cursor-pointer px-3 py-2 hover:bg-red-50 hover:text-red-700 ${
                item.nome === value ? 'bg-red-50 font-medium text-red-700' : 'text-gray-700'
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

export default function FipeSelects({ brand, model, onBrandChange, onModelChange }: Props) {
  const [brands, setBrands] = useState<FipeItem[]>([])
  const [models, setModels] = useState<FipeItem[]>([])
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [selectedBrandCode, setSelectedBrandCode] = useState<string | null>(null)
  const initialBrandLoadedRef = useRef(false)

  // Load brands on mount
  useEffect(() => {
    setLoadingBrands(true)
    fetch('/api/fipe/brands')
      .then(r => r.json())
      .then((data: FipeItem[]) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]))
      .finally(() => setLoadingBrands(false))
  }, [])

  // Edit mode: when brands load and brand prop is pre-filled, resolve the code and load models
  useEffect(() => {
    if (initialBrandLoadedRef.current) return
    if (!brand || brands.length === 0) return
    const match = brands.find(b => b.nome.toLowerCase() === brand.toLowerCase())
    if (!match) return
    initialBrandLoadedRef.current = true
    setSelectedBrandCode(match.codigo)
    loadModels(match.codigo)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, brands])

  // Load models when brand code changes
  const loadModels = useCallback((brandCode: string) => {
    setModels([])
    setLoadingModels(true)
    fetch(`/api/fipe/models?brand=${brandCode}`)
      .then(r => r.json())
      .then((data: FipeItem[]) => setModels(Array.isArray(data) ? data : []))
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false))
  }, [])

  function handleBrandSelect(nome: string, codigo: string) {
    setSelectedBrandCode(codigo)
    onBrandChange(nome)
    onModelChange('')  // clear model when brand changes
    loadModels(codigo)
  }

  function handleModelSelect(nome: string) {
    onModelChange(nome)
  }

  return (
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
        onChange={(nome) => handleModelSelect(nome)}
      />
    </div>
  )
}
