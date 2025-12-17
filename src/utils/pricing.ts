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
  finalSubtotal: number
  appliedPromotion: Promotion | null
}

export const pickWholesaleUnitPrice = (rows: unknown, quantity: number): number | null => {
  if (!Array.isArray(rows) || quantity <= 0) return null

  const normalized = rows
    .map((r: any) => ({ min: Number(r?.min), price: Number(r?.price) }))
    .filter((r) => Number.isFinite(r.min) && r.min > 0 && Number.isFinite(r.price) && r.price > 0)
    .sort((a, b) => a.min - b.min)

  let best: { min: number; price: number } | null = null
  for (const r of normalized) if (quantity >= r.min) best = r

  return best ? Math.ceil(best.price) : null
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
  // A) Promo sobre retail
  const bestPromo = pickBestPromotionForLine(retailUnitPrice, quantity, promotions, unitKey)
  const promoFinalSubtotal = bestPromo ? bestPromo.finalSubtotal : retailUnitPrice * quantity
  const promoUnitShown = quantity > 0 ? promoFinalSubtotal / quantity : retailUnitPrice

  if (wholesaleUnitPrice == null) {
    return {
      source: bestPromo ? 'promo' : 'retail',
      unitBasePrice: retailUnitPrice,
      unitShownPrice: promoUnitShown,
      finalSubtotal: promoFinalSubtotal,
      appliedPromotion: bestPromo?.promo ?? null
    }
  }

  // B) Mayoreo (sin promo)
  const wholesaleFinalSubtotal = wholesaleUnitPrice * quantity

  // C) elegir mejor
  if (wholesaleFinalSubtotal < promoFinalSubtotal) {
    return {
      source: 'wholesale',
      unitBasePrice: wholesaleUnitPrice,
      unitShownPrice: wholesaleUnitPrice,
      finalSubtotal: wholesaleFinalSubtotal,
      appliedPromotion: null
    }
  }

  return {
    source: bestPromo ? 'promo' : 'retail',
    unitBasePrice: retailUnitPrice,
    unitShownPrice: promoUnitShown,
    finalSubtotal: promoFinalSubtotal,
    appliedPromotion: bestPromo?.promo ?? null
  }
}
