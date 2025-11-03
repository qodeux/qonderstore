import { toRecord } from './helpers'

export const supplyOrder_status = [
  { key: 'approved', label: 'Aprobado', color: 'success' },
  { key: 'pending', label: 'Pendiente', color: 'success' },
  { key: 'partially_received', label: 'Parcialmente Recibido', color: 'info' },
  { key: 'completed', label: 'Completado', color: 'danger' },
  { key: 'cancelled', label: 'Cancelado', color: 'danger' },
  { key: 'pending_payment', label: 'Pago Pendiente', color: 'warning' },
  { key: 'partially_paid', label: 'Parcialmente Pagado', color: 'warning' },
  { key: 'under_review', label: 'En Revisión', color: 'info' }
] as const

export type SupplyOrderStatus = (typeof supplyOrder_status)[number]['key']

export const supplyOrdersStatusMap = toRecord(supplyOrder_status)
