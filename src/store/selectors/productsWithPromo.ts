// store/selectors/productsWithPromos.ts
import { createSelector } from '@reduxjs/toolkit'
import type { Product } from '../../schemas/products.schema'
import type { Promotion } from '../../schemas/promotions.schema'
import type { CartItem } from '../slices/cartSlice'
import type { RootState } from '../store'

// -------------------- Selectores base --------------------
export const selectProducts = (s: RootState) => s.products.items // Product[]
export const selectPromotions = (s: RootState) => s.promotions.items // Promotion[]

// -------------------- Helpers día/frecuencia --------------------
const dayCodes = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
type DayCode = (typeof dayCodes)[number]

const getTodayDayCode = (d = new Date()): DayCode => dayCodes[d.getDay()]

// frequency_value puede venir como array ['fri','sat'] o como objeto (por si el schema varía)
const getWeeklyDays = (p: Promotion): DayCode[] => {
  const v = p.frequency_value
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

// -------------------- Helpers de mapeo producto/categoría --------------------
const eqLooseId = (a: unknown, b: unknown) => {
  const na = Number(a)
  const nb = Number(b)
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
  const sub = prod.subcategory
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

// Candidatas (producto + categoría + subcategoría)
const getCandidatePromotionsForProduct = (
  prod: Product,
  byProduct: Map<number, Promotion[]>,
  byCatOrSub: Map<string, Promotion[]>
): Promotion[] => {
  const prodPromos = byProduct.get(prod.id) ?? []

  const catKey = getCategoryKey(prod)
  const subKey = getSubcategoryKey(prod)
  const catPromos = byCatOrSub.get(catKey) ?? []
  const subPromos = subKey ? (byCatOrSub.get(subKey) ?? []) : []

  return [...prodPromos, ...catPromos, ...subPromos].filter((p) => promoAppliesToProduct(p, prod))
}

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

/**
 * Evalúa una promo para una línea (precio unitario + cantidad).
 * Devuelve null si la promo NO aplica (no se cumple condición, etc.).
 */
export const evaluatePromotionForLine = (promo: Promotion, unitPrice: number, quantity: number): PromotionLineResult | null => {
  const subtotal = unitPrice * quantity

  if (quantity <= 0 || subtotal <= 0) return null
  if (!promo.is_active) return null // seguridad extra

  // 1) Condiciones
  const isConditioned = promo.is_conditioned
  const conditionType = promo.condition_type
  const conditionValue = promo.condition ?? 0

  let timesApplied = 1

  if (isConditioned && conditionType) {
    if (conditionType === 'min_sale') {
      // Interpretación sencilla: "min_sale" = cantidad mínima para activar la promo
      // (aplica solo una vez aunque superes esa cantidad)
      if (quantity < conditionValue) return null
      timesApplied = 1
    }

    if (conditionType === 'quantity') {
      if (conditionValue <= 0) return null

      if (promo.mode === 'percentage') {
        // porcentaje NO acumulativo: sólo se activa si cumples la cantidad mínima
        if (quantity < conditionValue) return null
        timesApplied = 1
      } else {
        // fixed / free: descuento acumulativo por múltiplos de la cantidad
        // Ej: conditionValue = 2, quantity = 4 => 2 veces; quantity = 5 => 2; quantity = 6 => 3
        timesApplied = Math.floor(quantity / conditionValue)
        if (timesApplied <= 0) return null
      }
    }
  }

  // 2) Monto de descuento según mode
  let totalDiscount = 0
  let discountPercent = 0

  if (promo.mode === 'free') {
    // Línea completa gratis cuando aplica
    totalDiscount = subtotal
    discountPercent = 100
  } else if (promo.mode === 'percentage') {
    discountPercent = promo.mode_value
    const per = promo.mode_value / 100
    totalDiscount = subtotal * per
  } else {
    // 'fixed'
    const base = promo.mode_value
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

/**
 * Escoge la mejor promo para una línea (precio unitario + cantidad)
 * según el mayor descuento total; 'free' gana siempre.
 */
export const pickBestPromotionForLine = (
  unitPrice: number,
  quantity: number,
  promos: Promotion[] | undefined
): PromotionLineResult | null => {
  if (!promos || promos.length === 0) return null

  const evaluated = promos.map((p) => evaluatePromotionForLine(p, unitPrice, quantity)).filter((r): r is PromotionLineResult => r !== null)

  if (evaluated.length === 0) return null

  evaluated.sort((a, b) => {
    const aIsFree = a.discountPercent >= 100
    const bIsFree = b.discountPercent >= 100
    if (aIsFree && !bIsFree) return -1
    if (!aIsFree && bIsFree) return 1

    // luego mayor descuento total
    return b.totalDiscount - a.totalDiscount || Number(a.promo.id) - Number(b.promo.id)
  })

  return evaluated[0]
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

// -------------------- Selector principal (compat: mejor promo para qty=1) --------------------
export type ProductWithPromo = Product & {
  appliedPromotion: Promotion | null
  finalPrice: number
  discountAmount: number
  discountPercent: number
  hasPromotion: boolean
}

/**
 * Mantiene la firma original, pero ahora usa la lógica de condiciones.
 * Interpreta la "mejor promo" asumiendo quantity = 1 (para catálogo).
 */
export const selectProductsWithBestPromo = createSelector(
  [selectProducts, selectActivePromosByProductId, selectActivePromosByCategoryOrSub],
  (products, byProduct, byCatOrSub) => {
    return products.map<ProductWithPromo>((prod) => {
      const price = prod.price ?? 0

      const candidates = getCandidatePromotionsForProduct(prod, byProduct, byCatOrSub)
      // Para la vista de catálogo asumimos qty = 1
      const best = pickBestPromotionForLine(price, 1, candidates)

      const subtotal = price
      const finalPrice = best ? best.finalSubtotal : subtotal
      const discountAmount = best ? best.totalDiscount : 0
      const discountPercent = best ? best.discountPercent : 0

      return {
        ...prod,
        appliedPromotion: best?.promo ?? null,
        finalPrice,
        discountAmount,
        discountPercent,
        hasPromotion: !!best
      }
    })
  }
)

// -------------------- Derivados útiles (compat con lo que ya tenías) --------------------
export const selectDiscountedProducts = createSelector([selectProductsWithBestPromo], (list) => list.filter((p) => p.hasPromotion))

export const makeSelectProductWithPromoById = (id: number) =>
  createSelector([selectProductsWithBestPromo], (list) => list.find((p) => p.id === id) ?? null)

export const makeSelectProductWithPromoBySlug = (slug: string) =>
  createSelector([selectProductsWithBestPromo], (list) => {
    const key = String(slug).toLowerCase()
    return list.find((p) => String(p.slug).toLowerCase() === key) ?? null
  })

// -------------------- NUEVOS: lista de promos candidatas por producto --------------------
export type ProductWithPromotionsMeta = Product & {
  promotions: Promotion[]
  hasPromotion: boolean
}

/**
 * Devuelve, para cada producto, las promos candidatas (product + category + subcategory).
 * NO tiene en cuenta la cantidad; sólo “esta promo podría aplicar a este producto”.
 */
export const selectProductsWithPromotionsMeta = createSelector(
  [selectProducts, selectActivePromosByProductId, selectActivePromosByCategoryOrSub],
  (products, byProduct, byCatOrSub): ProductWithPromotionsMeta[] => {
    return products.map((prod) => {
      const candidates = getCandidatePromotionsForProduct(prod, byProduct, byCatOrSub)

      return {
        ...prod,
        promotions: candidates,
        hasPromotion: candidates.length > 0
      }
    })
  }
)

/**
 * Selector por producto: devuelve el producto + las promos candidatas.
 * Útil en la ficha de producto o en el carrito para luego evaluar según quantity.
 */
export const makeSelectPromotionsForProduct = (id: number) =>
  createSelector([selectProductsWithPromotionsMeta], (list) => {
    const prod = list.find((p) => p.id === id)
    if (!prod) {
      return {
        product: null as Product | null,
        promotions: [] as Promotion[]
      }
    }
    const { promotions, ...product } = prod
    return {
      product: product as Product,
      promotions
    }
  })

// -------------------- CARRITO CON PROMOS --------------------
const selectCartItems = (s: RootState) => s.cart.items

export type CartLineWithPromo = CartItem & {
  subtotalBase: number
  finalSubtotal: number
  totalDiscount: number
  discountPercent: number
  appliedPromotion: Promotion | null
}

export type CartWithPromos = {
  lines: CartLineWithPromo[]
  cartSubtotal: number
  cartTotal: number
  cartDiscount: number
}

/**
 * Calcula, para cada línea del carrito, la mejor promo según cantidad
 * y devuelve totales del carrito con descuentos.
 */
export const selectCartWithPromos = createSelector(
  [selectCartItems, selectProducts, selectActivePromosByProductId, selectActivePromosByCategoryOrSub],
  (items, products, byProduct, byCatOrSub): CartWithPromos => {
    const lines: CartLineWithPromo[] = []
    let cartSubtotal = 0
    let cartTotal = 0
    let cartDiscount = 0

    for (const item of items) {
      const quantity = item.quantity ?? 0
      const unitBasePrice = item.basePrice ?? item.price // base sin promo

      const subtotalBase = unitBasePrice * quantity
      cartSubtotal += subtotalBase

      // buscamos el producto para poder sacar categoría/subcategoría
      const product = products.find((p) => p.id === item.id)

      if (!product || quantity <= 0 || unitBasePrice <= 0) {
        cartTotal += subtotalBase
        lines.push({
          ...item,
          subtotalBase,
          finalSubtotal: subtotalBase,
          totalDiscount: 0,
          discountPercent: 0,
          appliedPromotion: null
        })
        continue
      }

      const candidates = getCandidatePromotionsForProduct(product, byProduct, byCatOrSub)
      const best = pickBestPromotionForLine(unitBasePrice, quantity, candidates)

      if (!best) {
        cartTotal += subtotalBase
        lines.push({
          ...item,
          subtotalBase,
          finalSubtotal: subtotalBase,
          totalDiscount: 0,
          discountPercent: 0,
          appliedPromotion: null
        })
        continue
      }

      cartTotal += best.finalSubtotal
      cartDiscount += best.totalDiscount

      lines.push({
        ...item,
        subtotalBase,
        finalSubtotal: best.finalSubtotal,
        totalDiscount: best.totalDiscount,
        discountPercent: best.discountPercent,
        appliedPromotion: best.promo
      })
    }

    return {
      lines,
      cartSubtotal,
      cartTotal,
      cartDiscount
    }
  }
)
