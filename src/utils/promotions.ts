import type { Promotion } from '../schemas/promotions.schema'

// -------------------- Evaluación de promo según cantidad --------------------
export type PromotionLineResult = {
  promo: Promotion
  quantity: number
  unitPrice: number
  subtotal: number
  totalDiscount: number
  finalSubtotal: number
  timesApplied: number
  discountPercent: number
}

export const evaluatePromotionForLine = (
  promo: Promotion,
  unitPrice: number,
  quantity: number,
  unitKey?: string | null
): PromotionLineResult | null => {
  const subtotal = unitPrice * quantity

  if (quantity <= 0 || subtotal <= 0) return null
  if (!promo.is_active) return null

  // Filtro por unidad (si aplica)
  if (promo.product_unit) {
    if (!unitKey || promo.product_unit !== unitKey) return null
  }

  const isConditioned = promo.is_conditioned
  const conditionType = promo.condition_type
  const conditionValue = Number(promo.condition ?? 0)

  // ✅ define cuánta cantidad es elegible para descuento
  let eligibleQty = quantity
  let timesApplied = 1

  if (isConditioned && conditionType) {
    if (conditionType === 'min_sale') {
      if (quantity < conditionValue) return null
      // aplica 1 sola vez, pero sobre TODA la cantidad comprada
      eligibleQty = quantity
      timesApplied = 1
    }

    if (conditionType === 'quantity') {
      if (conditionValue <= 0) return null
      timesApplied = Math.floor(quantity / conditionValue)
      if (timesApplied <= 0) return null

      // aplica SOLO sobre múltiplos
      eligibleQty = timesApplied * conditionValue
    }
  }

  const eligibleSubtotal = unitPrice * eligibleQty

  let totalDiscount = 0
  let discountPercent = 0

  if (promo.mode === 'free') {
    totalDiscount = Math.min(subtotal, eligibleSubtotal)
    discountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0
  } else if (promo.mode === 'percentage') {
    const per = Number(promo.mode_value ?? 0) / 100
    totalDiscount = Math.min(subtotal, eligibleSubtotal * per)
    discountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0
  } else {
    // fixed: "X pesos" por aplicación
    const base = Number(promo.mode_value ?? 0)
    totalDiscount = base * timesApplied
    if (totalDiscount > subtotal) totalDiscount = subtotal
    discountPercent = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0
  }

  const finalSubtotal = Math.max(0, subtotal - totalDiscount)

  return {
    promo,
    quantity,
    unitPrice,
    subtotal,
    totalDiscount,
    finalSubtotal,
    timesApplied,
    discountPercent
  }
}

export const pickBestPromotionForLine = (
  unitPrice: number,
  quantity: number,
  promos: Promotion[] | undefined,
  unitKey?: string | null
): PromotionLineResult | null => {
  if (!promos || promos.length === 0) return null

  const evaluated = promos
    .map((p) => evaluatePromotionForLine(p, unitPrice, quantity, unitKey))
    .filter((r): r is PromotionLineResult => r !== null)

  if (evaluated.length === 0) return null

  evaluated.sort((a, b) => {
    const aIsFree = a.discountPercent >= 100
    const bIsFree = b.discountPercent >= 100
    if (aIsFree && !bIsFree) return -1
    if (!aIsFree && bIsFree) return 1
    return b.totalDiscount - a.totalDiscount || Number(a.promo.id) - Number(b.promo.id)
  })

  return evaluated[0]
}
