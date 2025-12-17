import { toRecord } from './helpers'
import type { SaleType } from './products'

export const storeOrder_status = [
  { key: 'pending', label: 'Pago pendiente', color: 'warning' },
  { key: 'paid', label: 'Pagado', color: 'primary' },
  { key: 'credited', label: 'Acreditado', color: 'success' },
  { key: 'canceled', label: 'Cancelado', color: 'danger' }
] as const

export type StoreOrderStatus = (typeof storeOrder_status)[number]['key']

export const storeOrdersStatusMap = toRecord(storeOrder_status)

export const storeShipment_status = [
  { key: 'pending', label: 'Envío pendiente', color: 'warning' },
  { key: 'processing', label: 'En proceso', color: 'primary' },
  { key: 'ready_for_pickup', label: 'Listo para recolección', color: 'success' },
  { key: 'picked_up', label: 'Recolectado', color: 'success' },
  { key: 'in_transit', label: 'En tránsito', color: 'success' },
  { key: 'delivered', label: 'Entregado', color: 'success' },
  { key: 'delivery_failed', label: 'Entrega fallida', color: 'danger' },
  { key: 'canceled', label: 'Cancelado', color: 'danger' }
] as const

export type StoreShipmentStatus = (typeof storeShipment_status)[number]['key']

export const storeShipmentStatusMap = toRecord(storeShipment_status)

export const delivery_types = [
  { key: 'standard', label: 'Estándar', color: 'primary' },
  { key: 'express', label: 'Urgente', color: 'danger' },
  { key: 'custom', label: 'Personalizado', color: 'secondary' },
  { key: 'foreign', label: 'Foráneo', color: 'success' },
  { key: 'pickup', label: 'Pickup', color: 'secondary' }
] as const

export type DeliveryTypes = (typeof delivery_types)[number]['key']
export const deliveryTypesMap = toRecord(delivery_types)

export const delivery_routes = [
  { key: '12', label: '12:00 pm' },
  { key: '14', label: '2:00 pm' },
  { key: '16', label: '4:00 pm' },
  { key: '18', label: '6:00 pm' },
  { key: '20', label: '8:00 pm' }
] as const
export type DeliveryRoutes = (typeof delivery_routes)[number]['key']
export const deliveryRoutesMap = toRecord(delivery_routes)

export const all_units = [
  { key: 'gr', label: 'Gramo', plural: 'Gramos', saleType: 'bulk' },
  { key: 'oz', label: 'Onza', plural: 'Onzas', saleType: 'bulk' },
  { key: 'lb', label: 'Libra', plural: 'Libras', saleType: 'bulk' },
  { key: 'pz', label: 'Pieza', plural: 'Piezas', saleType: 'unit' },
  { key: 'pk', label: 'Paquete', plural: 'Paquetes', saleType: 'unit' },
  { key: 'box', label: 'Caja', plural: 'Cajas', saleType: 'unit' }
] as const

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

export type SublocalityData = {
  id: number
  d_codigo: string
  d_asenta: string
  d_tipo_asenta: string
  D_mnpio: string
  d_estado: string
  d_ciudad: string
}

export type OrderItem = {
  id: number
  quantity: number
  saleType: SaleType
  unitSelected?: string | null

  // snapshot de precios
  price: number // subtotal final línea
  discount: number // descuento total línea

  // snapshot UI (para no depender del catálogo)
  title: string
  image?: string | null
  base_unit?: string | null
}
