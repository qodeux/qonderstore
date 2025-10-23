import { toRecord } from './helpers'

export const promo_types = [
  { key: 'product', label: 'Producto' },
  { key: 'category', label: 'Categoría' }
] as const

export type PromoType = (typeof promo_types)[number]['key']
export const promoTypeMap = toRecord(promo_types)

export const discount_types = [
  { key: 'season', label: 'Temporada' },
  { key: 'code', label: 'Código' }
  //{ key: 'buy_one_get_one', label: 'Compra uno y lleva otro' }
]
export type DiscountType = (typeof discount_types)[number]['key']
export const discountTypeMap = toRecord(discount_types)

export const isDiscountType = (v: unknown): v is DiscountType => typeof v === 'string' && discount_types.some((d) => d.key === v)

export const promo_frequencies = [
  { key: 'once', label: 'Una vez' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensual' }
  //{ key: 'custom', label: 'Personalizado' }
]

export type PromoFrequency = (typeof promo_frequencies)[number]['key']
export const promoFrequencyMap = toRecord(promo_frequencies)

export const promo_mode = [
  { key: 'percentage', label: 'Porcentaje' },
  { key: 'fixed', label: 'Fijo' }
]
export type PromoMode = (typeof promo_mode)[number]['key']
export const promoModeMap = toRecord(promo_mode)
