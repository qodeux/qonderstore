// hooks/useBestLinePromotion.ts
import { useMemo } from 'react'
import type { Promotion } from '../schemas/promotions.schema'
import { pickBestPromotionForLine, type PromotionLineResult } from '../utils/promotions'

type Args = {
  unitPrice: number
  quantity: number
  promotions: Promotion[]
  unitKey?: string | null // ✅ nuevo
}

type UseBestLinePromotionResult = {
  best: PromotionLineResult | null
  hasPromotion: boolean
  finalSubtotal: number
  totalDiscount: number
  discountPercent: number
  unitFinalPrice: number
}

export const useBestLinePromotion = ({ unitPrice, quantity, promotions, unitKey }: Args): UseBestLinePromotionResult => {
  return useMemo(() => {
    const subtotal = unitPrice * quantity

    if (!promotions || promotions.length === 0 || unitPrice <= 0 || quantity <= 0) {
      return {
        best: null,
        hasPromotion: false,
        finalSubtotal: subtotal,
        totalDiscount: 0,
        discountPercent: 0,
        unitFinalPrice: unitPrice
      }
    }

    // ✅ pásale la unidad seleccionada
    const best = pickBestPromotionForLine(unitPrice, quantity, promotions, unitKey ?? null)

    if (!best) {
      return {
        best: null,
        hasPromotion: false,
        finalSubtotal: subtotal,
        totalDiscount: 0,
        discountPercent: 0,
        unitFinalPrice: unitPrice
      }
    }

    const unitFinalPrice = quantity > 0 ? best.finalSubtotal / quantity : unitPrice

    return {
      best,
      hasPromotion: true,
      finalSubtotal: best.finalSubtotal,
      totalDiscount: best.totalDiscount,
      discountPercent: best.discountPercent,
      unitFinalPrice
    }
  }, [unitPrice, quantity, promotions, unitKey])
}
