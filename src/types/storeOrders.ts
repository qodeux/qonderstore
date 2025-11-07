import { toRecord } from './helpers'

export const storeOrder_status = [
  { key: 'pending', label: 'Detalle de orden', color: 'info' },
  { key: 'paid', label: 'Registrar pago', color: 'success' },
  { key: 'accredited', label: 'Acreditar pago', color: 'success' }
] as const

export type StoreOrderStatus = (typeof storeOrder_status)[number]['key']

export const storeOrdersStatusMap = toRecord(storeOrder_status)
