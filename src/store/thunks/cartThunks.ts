import { createAsyncThunk } from '@reduxjs/toolkit'
import { pickWholesaleUnitPrice, resolveBestDealExclusive } from '../../utils/pricing'
import { makeSelectPromotionsForProduct } from '../selectors/productsWithPromo'
import { applyLinePricing } from '../slices/cartSlice'
import type { RootState } from '../store'

// ===== helpers de dinero (sin floats raros) =====
const toCents = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100)
const fromCents = (c: number) => Number((c / 100).toFixed(2))
const normPrice = (n: number) => fromCents(toCents(n))

const resolveRetailUnitPrice = (product: any, unitKey: string | null): number => {
  const base = Number(product?.price ?? 0)
  if (!unitKey) return normPrice(base)

  const u = product?.units?.[unitKey]
  if (!u) return normPrice(base)

  const p = Number(u?.price)
  const f = Number(u?.factor)

  // 👇 OJO: NO ceil. Respetar centavos.
  if (Number.isFinite(p)) return normPrice(p)
  if (Number.isFinite(f)) return normPrice(base * f)
  return normPrice(base)
}

export const repriceCartLine = createAsyncThunk<
  void,
  { id: number; nextUnit: string; nextQuantity?: number; prevUnitSelected?: string | null },
  { state: RootState }
>('cart/repriceCartLine', async ({ id, nextUnit, nextQuantity, prevUnitSelected }, { getState, dispatch }) => {
  const state = getState()

  const item = state.cart.items.find(
    (it) => it.id === id && (it.unitSelected ?? it.base_unit ?? null) === (prevUnitSelected ?? it.base_unit ?? null)
  )
  if (!item) return

  const product = state.products.items.find((p) => p.id === id)
  if (!product) return

  const quantity = Math.max(1, nextQuantity ?? item.quantity ?? 1)
  const unitKey = (nextUnit ?? item.base_unit ?? null) as string | null

  const { promotions } = makeSelectPromotionsForProduct(id)(state)

  // retail unit (normalizado, sin ceil)
  const retailUnitPrice = resolveRetailUnitPrice(product as any, unitKey)

  // wholesale unit (asegura normalización también por si devuelve floats)
  const wholesaleRows = (product as any).wholesale_prices?.[unitKey ?? ''] ?? null
  const wholesaleUnitPriceRaw = pickWholesaleUnitPrice(wholesaleRows, quantity)
  const wholesaleUnitPrice = wholesaleUnitPriceRaw == null ? null : normPrice(Number(wholesaleUnitPriceRaw))

  const best = resolveBestDealExclusive({
    retailUnitPrice,
    wholesaleUnitPrice,
    quantity,
    promotions,
    unitKey
  })

  dispatch(
    applyLinePricing({
      id,
      prevUnitSelected: item.unitSelected ?? item.base_unit ?? null,
      unitSelected: unitKey ?? item.base_unit ?? '',
      quantity,

      // 👇 NO ceil. Normaliza unitario final.
      price: normPrice(Number(best.unitShownPrice)),

      // retail base (para comparar descuento) sin ceil
      basePrice: normPrice(retailUnitPrice),

      pricingSource: best.source
    })
  )
})
