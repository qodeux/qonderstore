import { createAsyncThunk } from '@reduxjs/toolkit'
import { pickWholesaleUnitPrice, resolveBestDealExclusive } from '../../utils/pricing'
import { makeSelectPromotionsForProduct } from '../selectors/productsWithPromo'
import { applyLinePricing } from '../slices/cartSlice'
import type { RootState } from '../store'

const ceil = (n: number) => Math.ceil(Number.isFinite(n) ? n : 0)

const resolveRetailUnitPrice = (product: any, unitKey: string | null): number => {
  const base = Number(product?.price ?? 0)
  if (!unitKey) return ceil(base)

  const u = product?.units?.[unitKey]
  if (!u) return ceil(base)

  const p = Number(u?.price)
  const f = Number(u?.factor)

  if (Number.isFinite(p)) return ceil(p)
  if (Number.isFinite(f)) return ceil(base * f)
  return ceil(base)
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
  const unitKey = nextUnit ?? item.base_unit ?? null

  const { promotions } = makeSelectPromotionsForProduct(id)(state)

  const retailUnitPrice = resolveRetailUnitPrice(product as any, unitKey)

  const wholesaleRows = (product as any).wholesale_prices?.[unitKey] ?? null
  const wholesaleUnitPrice = pickWholesaleUnitPrice(wholesaleRows, quantity)

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

      price: best.unitShownPrice,

      basePrice: retailUnitPrice,

      pricingSource: best.source
    })
  )
})
