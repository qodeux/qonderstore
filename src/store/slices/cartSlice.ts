import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { BulkUnits } from '../../schemas/products.schema'
import type { SaleType } from '../../types/products'

export type CartItem = {
  id: number
  title: string
  basePrice: number
  price: number // precio unitario base
  discount?: number // descuento unitario (monto)
  quantity: number
  stock: number
  image?: string
  error?: string
  saleType: SaleType
  units?: BulkUnits
  base_unit?: string
  unitSelected?: string
}

type CartState = {
  items: CartItem[]
  totalQuantity: number
  totalPrice: number // total a pagar (ya con descuento)
  subtotal: number // suma sin descuento (opcional para UI)
  totalDiscount: number // ahorro total (opcional para UI)
}

const STORAGE_KEY = 'qonderstore_cart_v1'

const loadInitialState = (): CartState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) throw new Error('no cart')
    const items: CartItem[] = JSON.parse(raw)
    return computeTotals(items)
  } catch {
    return { items: [], totalQuantity: 0, totalPrice: 0, subtotal: 0, totalDiscount: 0 }
  }
}

const saveState = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore write errors
  }
}

const toCents = (n: number) => Math.round((n ?? 0) * 100)
const fromCents = (c: number) => Number((c / 100).toFixed(2))
const ceilPrice = (n: number) => Math.ceil(Number.isFinite(n) ? n : 0)

const unitFinalCents = (it: CartItem) => {
  const base = toCents(it.price)
  const disc = toCents(it.discount ?? 0)

  // evita negativos si el descuento supera al precio
  return Math.max(0, base - Math.max(0, disc))
}

export const computeTotals = (items: CartItem[]): CartState => {
  let qty = 0
  let subtotalCents = 0
  let totalCents = 0
  let totalDiscountCents = 0

  for (const it of items) {
    const q = Math.max(0, it.quantity || 0)
    if (q === 0) continue

    const base = toCents(it.price)
    const finalUnit = unitFinalCents(it)

    qty += q
    subtotalCents += base * q
    totalCents += finalUnit * q
    totalDiscountCents += Math.max(0, base - finalUnit) * q
  }

  return {
    items,
    totalQuantity: qty,
    totalPrice: Math.ceil(fromCents(totalCents)),
    subtotal: Math.ceil(fromCents(subtotalCents)),
    totalDiscount: Math.ceil(fromCents(totalDiscountCents))
  }
}

const initialState: CartState = loadInitialState()

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      const incoming = { ...action.payload }
      const addQty = Math.max(1, incoming.quantity ?? 1)

      const idx = state.items.findIndex((it) => it.id === incoming.id)

      if (idx >= 0) {
        const item = state.items[idx]
        const stock = item.stock ?? 0 // ajusta si manejas stock indefinido
        const newQty = item.quantity + addQty

        if (newQty > stock) {
          // Excede stock: marca error y NO cambies la cantidad
          item.error = 'Stock insuficiente para agregar más unidades'
        } else {
          // Dentro de stock: limpia error y actualiza cantidad
          item.quantity = newQty
          item.error = undefined
        }
      } else {
        const stock = incoming.stock ?? 0
        if (addQty > stock) {
          // No lo agregues si ya excede el stock de entrada
          return
        }
        state.items.push({
          ...incoming,
          price: ceilPrice(incoming.price),
          basePrice: incoming.basePrice ?? incoming.price,
          unitSelected: incoming.unitSelected ?? incoming.base_unit, // opcional
          quantity: addQty,
          error: undefined
        })
      }

      const updated = computeTotals(state.items)
      state.items = updated.items
      state.totalQuantity = updated.totalQuantity
      state.totalPrice = updated.totalPrice

      saveState(state.items)
    },

    removeItem(state, action: PayloadAction<{ id: number }>) {
      const { id } = action.payload
      state.items = state.items.filter((it) => !(it.id === id))
      const updated = computeTotals(state.items)
      state.totalQuantity = updated.totalQuantity
      state.totalPrice = updated.totalPrice
      saveState(state.items)
    },

    updateQuantity(state, action: PayloadAction<{ id: number; quantity: number }>) {
      const { id, quantity } = action.payload
      const idx = state.items.findIndex((it) => it.id === id)

      if (idx >= 0) {
        const item = state.items[idx]
        const stock = item.stock ?? 0

        if (quantity <= 0) {
          // Eliminar si la cantidad es 0 o menor
          state.items.splice(idx, 1)
        } else if (quantity > stock) {
          // No permitir exceder el stock
          item.error = 'Stock insuficiente, no se actualizó la cantidad'
        } else {
          // Actualizar cantidad válida
          item.quantity = quantity
          item.error = undefined
        }
      }

      const updated = computeTotals(state.items)
      state.items = updated.items
      state.totalQuantity = updated.totalQuantity
      state.totalPrice = updated.totalPrice
      saveState(state.items)
    },

    updateUnit(state, action: PayloadAction<{ id: string | number; unit: string; unitsMap?: BulkUnits }>) {
      const { id, unit, unitsMap } = action.payload
      const idx = state.items.findIndex((it) => it.id === id)
      if (idx < 0) return

      const item = state.items[idx]
      const source = unitsMap ?? item.units ?? {}
      const baseUnit = item.base_unit

      let nextPrice: number | undefined

      if (unit === baseUnit) {
        // 1) Si la base existe en el mapa, úsala; si no, usa el precio base guardado
        const fromMap = baseUnit ? source[baseUnit]?.price : undefined
        nextPrice = Number.isFinite(fromMap) ? fromMap : item.basePrice
      } else {
        // 2) Unidades alternativas siempre vienen del mapa
        nextPrice = source?.[unit]?.price
      }

      if (!Number.isFinite(nextPrice as number)) {
        // opcional: item.error = 'Precio inválido para la unidad seleccionada'
        return
      }

      item.price = ceilPrice(nextPrice as number)
      item.unitSelected = unit
      item.error = undefined

      const updated = computeTotals(state.items)
      state.items = updated.items
      state.totalQuantity = updated.totalQuantity
      state.totalPrice = updated.totalPrice
      saveState(state.items)
    },

    clearError(state, action: PayloadAction<{ id: number }>) {
      const item = state.items.find((it) => it.id === action.payload.id)
      if (item) item.error = undefined
    },

    clearCart(state) {
      state.items = []
      state.totalPrice = 0
      state.totalQuantity = 0
      saveState(state.items)
    },

    setCart(state, action: PayloadAction<CartItem[]>) {
      const items = action.payload || []
      const updated = computeTotals(items)
      state.items = updated.items
      state.totalPrice = updated.totalPrice
      state.totalQuantity = updated.totalQuantity
      saveState(state.items)
    }
  }
})

export const { addItem, removeItem, updateQuantity, updateUnit, clearCart, setCart, clearError } = cartSlice.actions

export const selectCart = (state: { cart: CartState }) => state.cart
export const selectCartItems = (state: { cart: CartState }) => state.cart.items
export const selectCartTotals = (state: { cart: CartState }) => ({
  totalQuantity: state.cart.totalQuantity,
  totalPrice: state.cart.totalPrice
})

export default cartSlice.reducer
