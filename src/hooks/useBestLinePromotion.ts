// hooks/useBestLinePromotion.ts
import { useMemo } from 'react'
import type { Promotion } from '../schemas/promotions.schema'
import { pickBestPromotionForLine, type PromotionLineResult } from '../store/selectors/productsWithPromo'

type Args = {
  unitPrice: number // precio unitario SIN descuento (base)
  quantity: number // cantidad actual
  promotions: Promotion[] // promos candidatas del producto
}

type UseBestLinePromotionResult = {
  best: PromotionLineResult | null
  hasPromotion: boolean
  finalSubtotal: number // total de la línea (qty * unit) ya con descuento
  totalDiscount: number // descuento total aplicado en la línea
  discountPercent: number // % efectivo
  unitFinalPrice: number // precio unitario ya con descuento (para mostrar)
}

export const useBestLinePromotion = ({ unitPrice, quantity, promotions }: Args): UseBestLinePromotionResult => {
  return useMemo(() => {
    if (!promotions || promotions.length === 0 || unitPrice <= 0 || quantity <= 0) {
      const subtotal = unitPrice * quantity
      return {
        best: null,
        hasPromotion: false,
        finalSubtotal: subtotal,
        totalDiscount: 0,
        discountPercent: 0,
        unitFinalPrice: unitPrice
      }
    }

    const best = pickBestPromotionForLine(unitPrice, quantity, promotions)

    if (!best) {
      const subtotal = unitPrice * quantity
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
  }, [unitPrice, quantity, promotions])
}
