// store/selectors/productsWithPromos.ts
import { createSelector } from '@reduxjs/toolkit'
import type { Product } from '../../schemas/products.schema'
import type { Promotion } from '../../schemas/promotions.schema'
import type { RootState } from '../store'

// -------------------- Selectores base --------------------
export const selectProducts = (s: RootState) => s.products.items // Product[]
export const selectPromotions = (s: RootState) => s.promotions.items // Promotion[]

// -------------------- Helpers --------------------
const dayCodes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
type DayCode = (typeof dayCodes)[number]

const getTodayDayCode = (d = new Date()): DayCode => dayCodes[d.getDay()]

// frequency_value puede venir como array ['fri','sat'] o como objeto (por si el schema varía)
const getWeeklyDays = (p: Promotion): DayCode[] => {
  const v = (p as any).frequency_value
  if (Array.isArray(v)) return v as DayCode[]
  if (v && Array.isArray(v.days)) return v.days as DayCode[]
  return []
}

const isPromotionActive = (p: Promotion, at = new Date()): boolean => {
  if (!p.is_active) return false

  // vigencia
  if (p.valid_until) {
    const end = new Date(p.valid_until)
    if (Number.isFinite(end.getTime()) && at > end) return false
  }

  // frecuencia semanal
  if (p.frequency === 'weekly') {
    const allowed = getWeeklyDays(p)
    if (allowed.length > 0) {
      const today = getTodayDayCode(at)
      if (!allowed.includes(today)) return false
    }
  }

  return true
}

const eqLooseId = (a: unknown, b: unknown) => {
  const na = Number(a),
    nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb
  return String(a) === String(b)
}

// Nota: en tus datos reales, subcategory viene numérica (ej. 69)
// y category es string (ej. "Comestibles").
// Este helper normaliza claves para buscar en mapas.
const getCategoryKey = (prod: Product): string => {
  // si en el futuro agregas category_id numérico, úsalo aquí:
  // return String((prod as any).category_id ?? prod.category)
  return String(prod.category)
}
const getSubcategoryKey = (prod: Product): string | null => {
  const sub = (prod as any).subcategory
  if (sub === null || sub === undefined) return null
  return String(sub)
}

// ¿La promo aplica sobre el producto?
const promoAppliesToProduct = (promo: Promotion, product: Product): boolean => {
  if (promo.promo_type === 'product') {
    return eqLooseId(promo.promo_type_target_id, product.id)
  }
  if (promo.promo_type === 'category') {
    const matchCat = eqLooseId(promo.promo_type_target_id, getCategoryKey(product))
    const sub = getSubcategoryKey(product)
    const matchSub = sub ? eqLooseId(promo.promo_type_target_id, sub) : false
    return matchCat || matchSub
  }
  return false
}

type Applied = {
  finalPrice: number
  discountAmount: number
  discountPercent: number
}

const applyPromotion = (price: number, promo?: Promotion): Applied => {
  if (!promo) return { finalPrice: price, discountAmount: 0, discountPercent: 0 }

  if (promo.mode === 'free') {
    return { finalPrice: 0, discountAmount: price, discountPercent: price > 0 ? 100 : 0 }
  }

  if (promo.mode === 'percentage') {
    const discountAmount = (price * promo.mode_value) / 100
    const finalPrice = Math.max(0, price - discountAmount)
    return { finalPrice, discountAmount, discountPercent: promo.mode_value }
  }

  // 'fixed'
  const discountAmount = promo.mode_value
  const finalPrice = Math.max(0, price - discountAmount)
  const discountPercent = price > 0 ? (discountAmount / price) * 100 : 0
  return { finalPrice, discountAmount, discountPercent }
}

// Escoger “mejor promo” por mayor descuento efectivo; 'free' gana siempre
const pickBestPromotion = (price: number, promos: Promotion[] | undefined): Promotion | undefined => {
  if (!promos || promos.length === 0) return undefined
  const scored = promos.map((p) => {
    if (p.mode === 'free') return { p, effective: Number.POSITIVE_INFINITY }
    if (p.mode === 'percentage') return { p, effective: (price * p.mode_value) / 100 }
    return { p, effective: p.mode_value } // fixed
  })
  scored.sort((a, b) => b.effective - a.effective || Number(a.p.id) - Number(b.p.id))
  return scored[0].p
}

// -------------------- Índices de promos activas --------------------
const selectActivePromotions = createSelector([selectPromotions], (all) => all.filter((p) => isPromotionActive(p)))

const selectActivePromosByProductId = createSelector([selectActivePromotions], (promos) => {
  const map = new Map<number, Promotion[]>()
  for (const p of promos) {
    if (p.promo_type !== 'product') continue
    const key = Number(p.promo_type_target_id)
    const arr = map.get(key) ?? []
    arr.push(p)
    map.set(key, arr)
  }
  return map
})

const selectActivePromosByCategoryOrSub = createSelector([selectActivePromotions], (promos) => {
  const map = new Map<string, Promotion[]>() // clave: id objetivo como string (cat o subcat)
  for (const p of promos) {
    if (p.promo_type !== 'category') continue
    const key = String(p.promo_type_target_id)
    const arr = map.get(key) ?? []
    arr.push(p)
    map.set(key, arr)
  }
  return map
})

// -------------------- Selector principal --------------------
export type ProductWithPromo = Product & {
  appliedPromotion: Promotion | null
  finalPrice: number
  discountAmount: number
  discountPercent: number
  hasPromotion: boolean
}

export const selectProductsWithBestPromo = createSelector(
  [selectProducts, selectActivePromosByProductId, selectActivePromosByCategoryOrSub],
  (products, byProduct, byCatOrSub) => {
    return products.map<ProductWithPromo>((prod) => {
      const price = prod.price ?? 0

      // candidatas por producto
      const prodPromos = byProduct.get(prod.id) ?? []

      // candidatas por categoría / subcategoría
      const catKey = getCategoryKey(prod)
      const subKey = getSubcategoryKey(prod)
      const catPromos = byCatOrSub.get(catKey) ?? []
      const subPromos = subKey ? (byCatOrSub.get(subKey) ?? []) : []

      // pool total, filtrado defensivo por si cambia estructura
      const candidates = [...prodPromos, ...catPromos, ...subPromos].filter((p) => promoAppliesToProduct(p, prod))

      const best = pickBestPromotion(price, candidates)
      const { finalPrice, discountAmount, discountPercent } = applyPromotion(price, best)

      return {
        ...prod,
        appliedPromotion: best ?? null,
        finalPrice,
        discountAmount,
        discountPercent,
        hasPromotion: !!best
      }
    })
  }
)

// -------------------- Derivados útiles --------------------
export const selectDiscountedProducts = createSelector([selectProductsWithBestPromo], (list) => list.filter((p) => p.hasPromotion))

export const makeSelectProductWithPromoById = (id: number) =>
  createSelector([selectProductsWithBestPromo], (list) => list.find((p) => p.id === id) ?? null)

export const makeSelectProductWithPromoBySlug = (slug: string) =>
  createSelector([selectProductsWithBestPromo], (list) => {
    const key = String(slug).toLowerCase()
    return list.find((p) => String((p as any).slug).toLowerCase() === key) ?? null
  })
