import type { Promotion } from '../schemas/promotions.schema'
import { pickBestPromotionForLine } from './promotions'

export type WholesaleRow = {
  min: number
  price: number
}

export type PricingSource = 'retail' | 'promo' | 'wholesale'

export type BestDealExclusive = {
  source: PricingSource
  unitBasePrice: number
  unitShownPrice: number
  finalSubtotal: number // 👈 subtotal final en pesos enteros con regla smart
  appliedPromotion: Promotion | null
}

// ===== helpers dinero =====
export const toCents = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100)
export const fromCents = (c: number) => Number((c / 100).toFixed(2))

// usado para unit prices (2 decimales, sin inflar)
export const normPrice = (n: number) => fromCents(toCents(n))

// ===== SmartPesos (regla negocio) =====
// - si se pasa "por centavos" => baja
// - si no llega a entero => sube
export const smartPesosFromCents = (cents: number, downThresholdCents = 10) => {
  const safe = Number.isFinite(cents) ? Math.round(cents) : 0
  const whole = Math.floor(safe / 100)
  const frac = Math.abs(safe % 100) // 0..99

  if (frac === 0) return whole
  return frac <= downThresholdCents ? whole : whole + 1
}

// ==== Mayoreo: devuelve unit price normalizado ====
export const pickWholesaleUnitPrice = (rows: unknown, quantity: number): number | null => {
  if (!Array.isArray(rows) || quantity <= 0) return null

  const normalized = rows
    .map((r: any) => ({ min: Number(r?.min), price: Number(r?.price) }))
    .filter((r) => Number.isFinite(r.min) && r.min > 0 && Number.isFinite(r.price) && r.price > 0)
    .sort((a, b) => a.min - b.min)

  let best: { min: number; price: number } | null = null
  for (const r of normalized) if (quantity >= r.min) best = r

  return best ? normPrice(best.price) : null
}

export const resolveBestDealExclusive = ({
  retailUnitPrice,
  wholesaleUnitPrice,
  quantity,
  promotions,
  unitKey
}: {
  retailUnitPrice: number
  wholesaleUnitPrice: number | null
  quantity: number
  promotions: Promotion[] | undefined
  unitKey?: string | null
}): BestDealExclusive => {
  const q = Math.max(1, quantity)

  // centavos
  const retailUnitC = toCents(retailUnitPrice)

  // Promo sobre retail
  const bestPromo = pickBestPromotionForLine(retailUnitPrice, q, promotions, unitKey)
  const promoFinalSubtotalC = bestPromo ? toCents(bestPromo.finalSubtotal) : retailUnitC * q

  // unitShown (2 decimales) derivado del subtotal en centavos
  const promoUnitShownC = Math.round(promoFinalSubtotalC / q)
  const promoUnitShown = fromCents(promoUnitShownC)

  if (wholesaleUnitPrice == null) {
    return {
      source: bestPromo ? 'promo' : 'retail',
      unitBasePrice: normPrice(retailUnitPrice),
      unitShownPrice: promoUnitShown,
      finalSubtotal: smartPesosFromCents(promoFinalSubtotalC),
      appliedPromotion: bestPromo?.promo ?? null
    }
  }

  // Mayoreo (sin promo)
  const wholesaleUnitC = toCents(wholesaleUnitPrice)
  const wholesaleFinalSubtotalC = wholesaleUnitC * q

  // elegir mejor (comparación exacta en centavos)
  if (wholesaleFinalSubtotalC < promoFinalSubtotalC) {
    return {
      source: 'wholesale',
      unitBasePrice: normPrice(wholesaleUnitPrice),
      unitShownPrice: normPrice(wholesaleUnitPrice),
      finalSubtotal: smartPesosFromCents(wholesaleFinalSubtotalC),
      appliedPromotion: null
    }
  }

  return {
    source: bestPromo ? 'promo' : 'retail',
    unitBasePrice: normPrice(retailUnitPrice),
    unitShownPrice: promoUnitShown,
    finalSubtotal: smartPesosFromCents(promoFinalSubtotalC),
    appliedPromotion: bestPromo?.promo ?? null
  }
}
