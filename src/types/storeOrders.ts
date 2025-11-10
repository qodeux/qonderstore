import { toRecord } from './helpers'

export const storeOrder_status = [
  { key: 'pending', label: 'Pago pendiente', color: 'warning' },
  { key: 'paid', label: 'Pagado', color: 'primary' },
  { key: 'credited', label: 'Acreditado', color: 'success' },
  { key: 'canceled', label: 'Cancelado', color: 'danger' }
] as const

export type StoreOrderStatus = (typeof storeOrder_status)[number]['key']

export const storeOrdersStatusMap = toRecord(storeOrder_status)

export const deliveryTypes = [
  { key: 'standard', label: 'Estándar' },
  { key: 'express', label: 'Urgente' },
  { key: 'custom', label: 'Personalizado' }
] as const

export type DeliveryTypes = (typeof deliveryTypes)[number]['key']
export const deliveryTypesMap = toRecord(deliveryTypes)

export type IPGeolocation = {
  query: string
  status: 'success' | 'fail'
  country: string
  countryCode: string
  region: string
  regionName: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  isp: string
  org: string
  as: string
}
