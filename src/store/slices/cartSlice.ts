// store/slices/cartSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { BulkUnits } from '../../schemas/products.schema'
import type { SaleType } from '../../types/products'
import { normPrice, smartPesosFromCents, toCents } from '../../utils/pricing'

export type CartItem = {
  id: number
  title: string
  basePrice?: number
  price: number // precio unitario (congelado al agregar)
  discount?: number // descuento unitario (monto)
  quantity: number
  stock?: number
  image?: string
  error?: string
  saleType: SaleType
  units?: BulkUnits
  base_unit?: string
  unitSelected?: string
  pricingSource?: 'retail' | 'promo' | 'wholesale'
}

type CartState = {
  items: CartItem[]
  totalQuantity: number
  totalPrice: number // total a pagar (ceil SOLO al final)
  subtotal: number // ceil SOLO al final
  totalDiscount: number // ahorro total (SIN ceil)
}

export const STORAGE_KEY = 'qonderstore_cart_v1'

// Calcula todos los totales a partir de items
export const computeTotals = (items: CartItem[]): CartState => {
  let qty = 0
  let subtotalCents = 0
  let totalCents = 0
  let totalDiscountCents = 0

  for (const item of items) {
    const q = Math.max(0, item.quantity || 0)
    if (q === 0) continue

    const baseUnitCents = toCents(item.price) // unitShown
    const finalUnitCents = toCents(item.price) // si discount siempre 0, es igual
    // si vuelves a usar discount, calcula finalUnitCents = baseUnitCents - disc

    qty += q
    subtotalCents += baseUnitCents * q
    totalCents += finalUnitCents * q

    // si discount lo usas:
    // totalDiscountCents += Math.max(0, baseUnitCents - finalUnitCents) * q
  }

  return {
    items,
    totalQuantity: qty,
    totalPrice: smartPesosFromCents(totalCents),
    subtotal: smartPesosFromCents(subtotalCents),
    totalDiscount: Math.floor(totalDiscountCents / 100) // o también smart si quieres consistencia total
  }
}

const loadInitialState = (): CartState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('no cart')
    const items: CartItem[] = JSON.parse(raw).map((item: CartItem) => ({
      ...item,
      pricingSource: item.pricingSource ?? 'retail',
      // por seguridad, normaliza valores antiguos (si venían “ceileados”)
      price: normPrice(item.price),
      basePrice: item.basePrice == null ? item.basePrice : normPrice(item.basePrice),
      discount: item.discount == null ? item.discount : normPrice(item.discount)
    }))
    return computeTotals(items)
  } catch {
    return { items: [], totalQuantity: 0, totalPrice: 0, subtotal: 0, totalDiscount: 0 }
  }
}

const saveState = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

// ====== Helpers ======
const sameLine = (a: CartItem, b: CartItem) =>
  a.id === b.id && (a.unitSelected ?? a.base_unit ?? null) === (b.unitSelected ?? b.base_unit ?? null)

// ====== Slice ======
const initialState: CartState = loadInitialState()

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const incoming = { ...action.payload }
      // Normaliza unidad entrante
      incoming.unitSelected = incoming.unitSelected ?? incoming.base_unit
      incoming.pricingSource = incoming.pricingSource ?? 'retail'
      const addQty = Math.max(1, incoming.quantity ?? 1)

      const idx = state.items.findIndex((item) => sameLine(item, incoming))

      if (idx >= 0) {
        const item = state.items[idx]
        const stock = Number.isFinite(item.stock) ? item.stock : Infinity
        const nextQ = item.quantity + addQty

        if (nextQ > (stock ?? 0)) {
          item.error = 'Stock insuficiente para agregar más unidades'
        } else {
          item.quantity = nextQ
          item.error = undefined
          // Si quisieras refrescar promo/unit price podrías actualizar aquí
          // item.price = normPrice(incoming.price)
          // item.basePrice = normPrice(incoming.basePrice ?? incoming.price)
        }
      } else {
        const stock = Number.isFinite(incoming.stock) ? incoming.stock : Infinity
        if (addQty > (stock ?? 0)) return
        state.items.push({
          ...incoming,
          pricingSource: incoming.pricingSource,
          // NO ceil en unit price/basePrice
          price: normPrice(incoming.price),
          basePrice: normPrice(incoming.basePrice ?? incoming.price),
          unitSelected: incoming.unitSelected,
          quantity: addQty,
          error: undefined
        })
      }

      const updated = computeTotals(state.items)
      state.items = updated.items
      state.totalQuantity = updated.totalQuantity
      state.totalPrice = updated.totalPrice
      state.subtotal = updated.subtotal
      state.totalDiscount = updated.totalDiscount
      saveState(state.items)
    },

    removeItem(state, action: PayloadAction<{ id: number; unitSelected?: string }>) {
      const { id, unitSelected } = action.payload
      state.items = state.items.filter(
        (item) => !(item.id === id && (item.unitSelected ?? item.base_unit ?? null) === (unitSelected ?? item.base_unit ?? null))
      )
      const updated = computeTotals(state.items)
      state.items = updated.items
      state.totalQuantity = updated.totalQuantity
      state.totalPrice = updated.totalPrice
      state.subtotal = updated.subtotal
      state.totalDiscount = updated.totalDiscount
      saveState(state.items)
    },

    updateQuantity(state, action: PayloadAction<{ id: number; unitSelected?: string; quantity: number }>) {
      const { id, unitSelected, quantity } = action.payload
      const idx = state.items.findIndex(
        (item) => item.id === id && (item.unitSelected ?? item.base_unit ?? null) === (unitSelected ?? item.base_unit ?? null)
      )
      if (idx >= 0) {
        const item = state.items[idx]
        const stock = Number.isFinite(item.stock) ? item.stock : Infinity
        if (quantity <= 0) state.items.splice(idx, 1)
        else if (quantity > (stock ?? 0)) item.error = 'Stock insuficiente, no se actualizó la cantidad'
        else {
          item.quantity = quantity
          item.error = undefined
        }
      }
      const updated = computeTotals(state.items)
      state.items = updated.items
      state.totalQuantity = updated.totalQuantity
      state.totalPrice = updated.totalPrice
      state.subtotal = updated.subtotal
      state.totalDiscount = updated.totalDiscount
      saveState(state.items)
    },

    updateUnit(state, action: PayloadAction<{ id: number; unit: string; unitsMap?: BulkUnits }>) {
      const { id, unit, unitsMap } = action.payload
      const idx = state.items.findIndex((item) => item.id === id)
      if (idx < 0) return

      const item = state.items[idx]

      // IMPORTANTE: si esta línea es wholesale, NO recalcules aquí
      // porque el precio depende de tiers por cantidad y unidad.
      if (item.pricingSource === 'wholesale') {
        item.error = 'Este producto usa precio de mayoreo; actualiza el precio desde la ficha del producto.'
        return
      }

      const source = unitsMap ?? item.units ?? {}
      const baseUnit = item.base_unit

      // Config de la unidad seleccionada
      const unitConfig: any = unit ? (source as any)[unit] : undefined

      // Precio base en la unidad base (ya con promo aplicada si la hubo)
      const baseUnitPrice = item.basePrice ?? item.price

      let nextPrice: number | undefined

      if (unit === baseUnit) {
        // Volvemos a la unidad base
        const p = unitConfig && Number(unitConfig.price)
        nextPrice = Number.isFinite(p) ? p : baseUnitPrice
      } else {
        const p = unitConfig && Number(unitConfig.price)
        const f = unitConfig && Number(unitConfig.factor)

        if (Number.isFinite(p)) {
          nextPrice = p
        } else if (Number.isFinite(f)) {
          nextPrice = baseUnitPrice * f
        } else {
          // No sabemos cómo calcular el precio para esta unidad
          return
        }
      }

      if (!Number.isFinite(nextPrice)) return

      // NO ceil: respeta decimales
      item.price = normPrice(nextPrice as number)
      item.unitSelected = unit
      item.error = undefined

      const updated = computeTotals(state.items)
      state.items = updated.items
      state.totalQuantity = updated.totalQuantity
      state.totalPrice = updated.totalPrice
      state.subtotal = updated.subtotal
      state.totalDiscount = updated.totalDiscount
      saveState(state.items)
    },

    applyLinePricing(
      state,
      action: PayloadAction<{
        id: number
        prevUnitSelected?: string | null
        unitSelected: string
        quantity: number
        price: number
        basePrice: number
        pricingSource: 'retail' | 'promo' | 'wholesale'
      }>
    ) {
      const { id, prevUnitSelected, unitSelected, quantity, price, basePrice, pricingSource } = action.payload

      const idx = state.items.findIndex(
        (it) => it.id === id && (it.unitSelected ?? it.base_unit ?? null) === (prevUnitSelected ?? it.base_unit ?? null)
      )
      if (idx < 0) return

      const item = state.items[idx]
      item.unitSelected = unitSelected
      item.quantity = Math.max(1, quantity)

      // NO ceil en unit/base: respeta mayoreo/promo con centavos
      item.price = normPrice(price)
      item.basePrice = normPrice(basePrice)

      item.pricingSource = pricingSource
      item.discount = 0
      item.error = undefined

      const updated = computeTotals(state.items)
      state.items = updated.items
      state.totalQuantity = updated.totalQuantity
      state.totalPrice = updated.totalPrice
      state.subtotal = updated.subtotal
      state.totalDiscount = updated.totalDiscount
      saveState(state.items)
    },

    clearError(state, action: PayloadAction<{ id: number }>) {
      const item = state.items.find((item) => item.id === action.payload.id)
      if (item) item.error = undefined
    },

    clearCart(state) {
      state.items = []
      state.totalPrice = 0
      state.totalQuantity = 0
      state.subtotal = 0
      state.totalDiscount = 0
      saveState(state.items)
    },

    setCart(state, action: PayloadAction<CartItem[]>) {
      const items = (action.payload || []).map((it) => ({
        ...it,
        pricingSource: it.pricingSource ?? 'retail',
        price: normPrice(it.price),
        basePrice: it.basePrice == null ? it.basePrice : normPrice(it.basePrice),
        discount: it.discount == null ? it.discount : normPrice(it.discount)
      }))
      const updated = computeTotals(items)
      state.items = updated.items
      state.totalPrice = updated.totalPrice
      state.totalQuantity = updated.totalQuantity
      state.subtotal = updated.subtotal
      state.totalDiscount = updated.totalDiscount
      saveState(state.items)
    }
  }
})

export const { addItem, removeItem, updateQuantity, updateUnit, clearCart, setCart, clearError, applyLinePricing } = cartSlice.actions

export const selectCart = (state: { cart: CartState }) => state.cart
export const selectCartItems = (state: { cart: CartState }) => state.cart.items
export const selectCartTotals = (state: { cart: CartState }) => ({
  totalQuantity: state.cart.totalQuantity,
  totalPrice: state.cart.totalPrice,
  subtotal: state.cart.subtotal,
  totalDiscount: state.cart.totalDiscount
})

export default cartSlice.reducer
