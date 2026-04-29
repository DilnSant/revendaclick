'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  type Vehicle, type VehicleCondition, type FuelType, type TransmissionType,
  CONDITION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS,
  slugify,
} from '@/lib/vehicles'
import { createVehicle, updateVehicle } from '@/app/(dashboard)/vehicles/actions'

interface Props {
  vehicle?: Vehicle
  onClose: () => void
  onSaved: (vehicle: Vehicle) => void
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i)

type FormState = {
  title: string
  brand: string
  model: string
  version: string
  year_model: number
  year_manufacture: number
  color: string
  mileage: number | ''
  fuel: FuelType
  transmission: TransmissionType
  doors: number | ''
  price: number | ''
  price_negotiable: boolean
  fipe_price: number | ''
  condition: VehicleCondition
  description: string
  plate_last_digits: string
  thumbnail_url: string
  slug: string
}

function initialForm(v?: Vehicle): FormState {
  return {
    title:           v?.title ?? '',
    brand:           v?.brand ?? '',
    model:           v?.model ?? '',
    version:         v?.version ?? '',
    year_model:      v?.year_model ?? CURRENT_YEAR,
    year_manufacture: v?.year_manufacture ?? CURRENT_YEAR,
    color:           v?.color ?? '',
    mileage:         v?.mileage ?? '',
    fuel:            (v?.fuel as FuelType) ?? 'flex',
    transmission:    (v?.transmission as TransmissionType) ?? 'manual',
    doors:           v?.doors ?? '',
    price:           v?.price ?? '',
    price_negotiable: v?.price_negotiable ?? false,
    fipe_price:      v?.fipe_price ?? '',
    condition:       (v?.condition as VehicleCondition) ?? 'used',
    description:     v?.description ?? '',
    plate_last_digits: v?.plate_last_digits ?? '',
    thumbnail_url:   v?.thumbnail_url ?? '',
    slug:            v?.slug ?? '',
  }
}

export default function VehicleForm({ vehicle, onClose, onSaved }: Props) {
  const isEdit = !!vehicle
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm(vehicle))

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Auto-generate slug from title + year when creating
  useEffect(() => {
    if (!isEdit && form.title) {
      setForm((prev) => ({ ...prev, slug: slugify(`${prev.title}-${prev.year_model}`) }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.year_model, isEdit])

  function set(field: 'title' | 'brand' | 'model' | 'version' | 'color' | 'fuel' | 'transmission' | 'condition' | 'description' | 'plate_last_digits' | 'thumbnail_url' | 'slug') {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function setYear(field: 'year_model' | 'year_manufacture') {
    return (e: React.ChangeEvent<HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: Number(e.target.value) }))
  }

  function setCheck(field: 'price_negotiable') {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.checked }))
  }

  function setNum(field: 'mileage' | 'doors' | 'price' | 'fipe_price') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value === '' ? '' : Number(e.target.value)
      setForm((prev) => ({ ...prev, [field]: v }))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = {
      title:            form.title.trim(),
      brand:            form.brand.trim(),
      model:            form.model.trim(),
      version:          form.version.trim() || undefined,
      year_model:       form.year_model,
      year_manufacture: form.year_manufacture,
      color:            form.color.trim() || undefined,
      mileage:          Number(form.mileage) || 0,
      fuel:             form.fuel,
      transmission:     form.transmission,
      doors:            form.doors !== '' ? Number(form.doors) : undefined,
      price:            Number(form.price),
      price_negotiable: form.price_negotiable,
      fipe_price:       form.fipe_price !== '' ? Number(form.fipe_price) : undefined,
      condition:        form.condition,
      description:      form.description.trim() || undefined,
      plate_last_digits: form.plate_last_digits.trim() || undefined,
      thumbnail_url:    form.thumbnail_url.trim() || undefined,
      slug:             form.slug.trim(),
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateVehicle(vehicle.id, payload)
        : await createVehicle(payload)

      if (result.error) {
        if (result.error.upgrade_required) {
          setUpgradeRequired(true)
        } else {
          setError(result.error.message)
        }
        return
      }
      onSaved(result.data!)
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col overflow-hidden
                      border-l border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Editar veículo' : 'Novo veículo'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {upgradeRequired && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-700">Limite atingido</p>
                <p className="mt-1 text-xs text-red-600">Faça upgrade para cadastrar mais veículos.</p>
                <a href="/settings" className="mt-2 inline-block text-xs font-semibold text-red-700 underline">
                  Ver planos →
                </a>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
                <button type="button" onClick={() => setError(null)} className="ml-2 text-red-400">✕</button>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="label">Título do anúncio <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={set('title')} required className="input" placeholder="Ex: Honda Civic EXL 2022" />
            </div>

            {/* Brand / Model / Version */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Marca <span className="text-red-500">*</span></label>
                <input type="text" value={form.brand} onChange={set('brand')} required className="input" placeholder="Honda" />
              </div>
              <div>
                <label className="label">Modelo <span className="text-red-500">*</span></label>
                <input type="text" value={form.model} onChange={set('model')} required className="input" placeholder="Civic" />
              </div>
              <div>
                <label className="label">Versão</label>
                <input type="text" value={form.version} onChange={set('version')} className="input" placeholder="EXL" />
              </div>
            </div>

            {/* Year model / manufacture */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Ano modelo <span className="text-red-500">*</span></label>
                <select value={form.year_model} onChange={setYear('year_model')} className="input">
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ano fabricação <span className="text-red-500">*</span></label>
                <select value={form.year_manufacture} onChange={setYear('year_manufacture')} className="input">
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Condition / Fuel / Transmission */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Condição <span className="text-red-500">*</span></label>
                <select value={form.condition} onChange={set('condition')} className="input">
                  {(Object.keys(CONDITION_LABELS) as VehicleCondition[]).map((c) => (
                    <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Combustível <span className="text-red-500">*</span></label>
                <select value={form.fuel} onChange={set('fuel')} className="input">
                  {(Object.keys(FUEL_LABELS) as FuelType[]).map((f) => (
                    <option key={f} value={f}>{FUEL_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Câmbio <span className="text-red-500">*</span></label>
                <select value={form.transmission} onChange={set('transmission')} className="input">
                  {(Object.keys(TRANSMISSION_LABELS) as TransmissionType[]).map((t) => (
                    <option key={t} value={t}>{TRANSMISSION_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mileage / Doors / Color */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Km rodados</label>
                <input type="number" min="0" value={form.mileage} onChange={setNum('mileage')} className="input" placeholder="0" />
              </div>
              <div>
                <label className="label">Portas</label>
                <select
                  value={form.doors}
                  onChange={(e) => setForm((prev) => ({ ...prev, doors: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="input"
                >
                  <option value="">—</option>
                  {[2, 4].map((d) => <option key={d} value={d}>{d} portas</option>)}
                </select>
              </div>
              <div>
                <label className="label">Cor</label>
                <input type="text" value={form.color} onChange={set('color')} className="input" placeholder="Prata" />
              </div>
            </div>

            {/* Price / FIPE / Negotiable */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Preço (R$) <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={setNum('price')} required className="input" placeholder="85000" />
              </div>
              <div>
                <label className="label">Preço FIPE (R$)</label>
                <input type="number" min="0" step="0.01" value={form.fipe_price} onChange={setNum('fipe_price')} className="input" placeholder="Opcional" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.price_negotiable} onChange={setCheck('price_negotiable')} className="h-3.5 w-3.5 rounded accent-primary" />
              Preço negociável
            </label>

            {/* Thumbnail URL */}
            <div>
              <label className="label">URL da foto principal</label>
              <input type="url" value={form.thumbnail_url} onChange={set('thumbnail_url')} className="input" placeholder="https://..." />
            </div>

            {/* Description */}
            <div>
              <label className="label">Descrição</label>
              <textarea value={form.description} onChange={set('description')} rows={3} className="input resize-none" placeholder="Descreva os opcionais, estado do veículo…" />
            </div>

            {/* Plate / Slug */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Últimos dígitos da placa</label>
                <input type="text" maxLength={4} value={form.plate_last_digits} onChange={set('plate_last_digits')} className="input" placeholder="AB12" />
              </div>
              <div>
                <label className="label">Slug (URL) <span className="text-red-500">*</span></label>
                <input type="text" value={form.slug} onChange={set('slug')} required className="input" placeholder="honda-civic-2022" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar veículo'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
