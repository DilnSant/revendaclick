'use client'

import Link from 'next/link'
import { useState, useOptimistic, useTransition } from 'react'
import {
  type Vehicle, type VehicleStatus,
  STATUS_LABELS, STATUS_BADGE, CONDITION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS,
  formatPrice,
} from '@/lib/vehicles'
import { deleteVehicle, toggleVehicleStatus, toggleVehicleFeatured } from '@/app/(dashboard)/vehicles/actions'
import type { PlanUsage } from '@/lib/tenant'
import VehicleForm from './VehicleForm'

interface Props {
  vehicles: Vehicle[]
  total: number
  usage: PlanUsage | null
}

export default function VehicleGrid({ vehicles, usage }: Omit<Props, 'total'> & { total?: number }) {
  const [, startTransition] = useTransition()
  const [optimisticVehicles, updateOptimistic] = useOptimistic(
    vehicles,
    (state: Vehicle[], action:
      | { type: 'delete'; id: string }
      | { type: 'update'; vehicle: Vehicle }
      | { type: 'add'; vehicle: Vehicle }
    ) => {
      if (action.type === 'delete') return state.filter((v) => v.id !== action.id)
      if (action.type === 'update') return state.map((v) => v.id === action.vehicle.id ? action.vehicle : v)
      if (action.type === 'add') return [action.vehicle, ...state]
      return state
    },
  )

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)

  const vehicleLimit = usage?.max_vehicles ?? null
  const vehicleUsed = usage?.vehicles_count ?? 0
  const usagePct = vehicleLimit ? Math.round((vehicleUsed / vehicleLimit) * 100) : 0
  const atLimit = vehicleLimit !== null && vehicleUsed >= vehicleLimit

  function handleDelete(vehicle: Vehicle) {
    if (!confirm(`Excluir "${vehicle.title}"? Esta ação não pode ser desfeita.`)) return
    startTransition(async () => {
      updateOptimistic({ type: 'delete', id: vehicle.id })
      await deleteVehicle(vehicle.id)
    })
  }

  function handleStatusChange(vehicle: Vehicle, status: VehicleStatus) {
    startTransition(async () => {
      updateOptimistic({ type: 'update', vehicle: { ...vehicle, status } })
      await toggleVehicleStatus(vehicle.id, status)
    })
  }

  function handleFeaturedToggle(vehicle: Vehicle) {
    startTransition(async () => {
      const next = !vehicle.is_featured
      updateOptimistic({ type: 'update', vehicle: { ...vehicle, is_featured: next } })
      await toggleVehicleFeatured(vehicle.id, next)
    })
  }

  function handleCreated(vehicle: Vehicle) {
    startTransition(async () => {
      updateOptimistic({ type: 'add', vehicle })
    })
    setShowForm(false)
  }

  function handleUpdated(vehicle: Vehicle) {
    startTransition(async () => {
      updateOptimistic({ type: 'update', vehicle })
    })
    setEditingVehicle(null)
  }

  function openNew() {
    if (atLimit) {
      setUpgradeRequired(true)
      return
    }
    setShowForm(true)
  }

  return (
    <>
      {/* Plan usage bar */}
      {usage && vehicleLimit !== null && vehicleLimit > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-card">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Veículos cadastrados</span>
            <span className={usagePct >= 100 ? 'font-semibold text-red-600' : usagePct >= 85 ? 'font-semibold text-orange-500' : ''}>
              {vehicleUsed} / {vehicleLimit}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePct >= 100 ? 'bg-red-500' :
                usagePct >= 85  ? 'bg-orange-400' :
                usagePct >= 80  ? 'bg-yellow-400' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePct, 100)}%` }}
            />
          </div>
          {usagePct >= 85 && usagePct < 100 && (
            <p className="mt-2 text-xs text-orange-600">
              Você atingiu {usagePct}% do limite. <Link href="/settings" className="underline">Faça upgrade</Link> para não perder oportunidades.
            </p>
          )}
          {usagePct >= 100 && (
            <p className="mt-2 text-xs text-red-600 font-medium">
              Limite atingido. <Link href="/settings" className="underline font-semibold">Faça upgrade</Link> para adicionar mais veículos.
            </p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {optimisticVehicles.length} veículo{optimisticVehicles.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={openNew}
          disabled={atLimit}
          className="btn-primary text-xs disabled:opacity-50"
        >
          + Novo veículo
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400">✕</button>
        </div>
      )}

      {upgradeRequired && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">Limite de veículos atingido</p>
          <p className="mt-1 text-xs text-red-600">
            Faça upgrade do seu plano para cadastrar mais veículos.
          </p>
          <Link href="/settings" className="mt-3 inline-block rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700">
            Ver planos
          </Link>
          <button onClick={() => setUpgradeRequired(false)} className="mt-3 ml-3 text-xs text-red-400">
            Fechar
          </button>
        </div>
      )}

      {/* Grid */}
      {optimisticVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
          <p className="text-sm text-gray-400">Nenhum veículo cadastrado</p>
          <button onClick={openNew} className="btn-primary mt-4 text-xs">
            + Adicionar primeiro veículo
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {optimisticVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={() => setEditingVehicle(vehicle)}
              onDelete={() => handleDelete(vehicle)}
              onStatusChange={(status) => handleStatusChange(vehicle, status)}
              onFeaturedToggle={() => handleFeaturedToggle(vehicle)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit form drawer */}
      {(showForm || editingVehicle) && (
        <VehicleForm
          vehicle={editingVehicle ?? undefined}
          onClose={() => { setShowForm(false); setEditingVehicle(null) }}
          onSaved={editingVehicle ? handleUpdated : handleCreated}
        />
      )}
    </>
  )
}

// ─── Vehicle card ──────────────────────────────────────────────────────────────

interface CardProps {
  vehicle: Vehicle
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: VehicleStatus) => void
  onFeaturedToggle: () => void
}

const STATUS_OPTIONS: VehicleStatus[] = ['available', 'reserved', 'sold', 'inactive']

function VehicleCard({ vehicle, onEdit, onDelete, onStatusChange, onFeaturedToggle }: CardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      {/* Thumbnail */}
      <div className="relative h-44 w-full bg-gray-100">
        {vehicle.thumbnail_url || vehicle.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vehicle.thumbnail_url ?? vehicle.images[0]}
            alt={vehicle.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-200">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM7.3 7l1.4-3.6A1 1 0 019.6 3H17a1 1 0 01.9.6L19 7M3 11l1-4h16l1 4v4H3v-4z" />
            </svg>
            <span className="text-[10px] text-gray-300">Sem foto</span>
          </div>
        )}
        {/* Photo count badge */}
        {(vehicle.images?.length ?? 0) > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
            {vehicle.images.length} fotos
          </span>
        )}

        {/* Featured badge */}
        {vehicle.is_featured && (
          <span className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-yellow-900">
            Destaque
          </span>
        )}

        {/* Status badge */}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium
                      ${STATUS_BADGE[vehicle.status]}`}
        >
          {STATUS_LABELS[vehicle.status]}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="line-clamp-1 text-sm font-semibold text-gray-900">{vehicle.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
          <span>{vehicle.year_model}</span>
          <span className="text-gray-200">·</span>
          <span>{FUEL_LABELS[vehicle.fuel]}</span>
          <span className="text-gray-200">·</span>
          <span>{TRANSMISSION_LABELS[vehicle.transmission]}</span>
          {vehicle.mileage > 0 && (
            <>
              <span className="text-gray-200">·</span>
              <span>{(vehicle.mileage / 1000).toFixed(0)}k km</span>
            </>
          )}
        </div>
        <p className="mt-1.5 text-base font-bold text-primary">{formatPrice(vehicle.price)}</p>
        {vehicle.price_negotiable && (
          <p className="text-[10px] text-gray-400">Negociável</p>
        )}

        {/* Stats */}
        <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
          <span title="Visualizações">👁 {vehicle.views_count}</span>
          <span title="Leads">📋 {vehicle.leads_count}</span>
          <span className="ml-auto text-[10px] text-gray-300">{CONDITION_LABELS[vehicle.condition]}</span>
        </div>
      </div>

      {/* Actions overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent
                      opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-1.5 p-3">
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg bg-white py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
          >
            Editar
          </button>
          <select
            value={vehicle.status}
            onChange={(e) => onStatusChange(e.target.value as VehicleStatus)}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg bg-white px-2 py-1.5 text-xs text-gray-900 outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            onClick={onFeaturedToggle}
            title={vehicle.is_featured ? 'Remover destaque' : 'Destacar'}
            className="rounded-lg bg-white p-1.5 text-xs hover:bg-gray-100"
          >
            {vehicle.is_featured ? '⭐' : '☆'}
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg bg-red-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
