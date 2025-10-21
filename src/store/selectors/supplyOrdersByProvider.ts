import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// Selector base: obtiene las órdenes
const selectSupplyOrders = (state: RootState) => state.providers.supplyOrders
const selectProducts = (state: RootState) => state.products.items

// Indexa productos por id para acceso O(1)
const selectProductsById = createSelector([selectProducts], (products) => {
  // Usa Map para mejor semántica/velocidad (o un Record si prefieres)
  const byId = new Map<number, (typeof products)[number]>()
  for (const p of products) byId.set(p.id, p)
  return byId
})

/**
 * Selector "factory" que:
 *  - filtra órdenes por providerId
 *  - enriquece cada item de la orden con los datos del producto
 *
 * Estructura de salida:
 * order => {
 *   ...order,
 *   items: Array<{
 *     id: number;      // id del producto (original)
 *     qty: number;     // cantidad (original)
 *     product: Product // objeto producto completo (anidado)
 *   }>
 * }
 */
export const makeSelectOrdersWithProductDetailsByProvider = () =>
  createSelector(
    [selectSupplyOrders, selectProductsById, (_: RootState, providerId: number) => providerId],
    (orders, productsById, providerId) =>
      orders
        .filter((o) => o.provider_id === providerId)
        .map((o) => ({
          ...o,
          items: o.items.map((it) => ({
            id: it.id,
            qty: it.qty,
            product: productsById.get(it.id) ?? null // maneja faltantes
          }))
        }))
  )
