export const promo_types = [
  { key: 'product', name: 'Producto' },
  { key: 'category', name: 'Categoria' }
] as const

export type PromoType = (typeof promo_types)[number]['key']

export const discount_types = [
  { key: 'season', name: 'Temporada' },
  { key: 'code', name: 'Código' }
  //{ key: 'buy_one_get_one', name: 'Compra uno y lleva otro' }
]
export type DiscountType = (typeof discount_types)[number]['key']

export const isDiscountType = (v: unknown): v is DiscountType => typeof v === 'string' && discount_types.some((d) => d.key === v)

export const promo_frequencies = [
  { key: 'once', name: 'Una vez' },
  { key: 'weekly', name: 'Semanal' },
  { key: 'monthly', name: 'Mensual' }
  //{ key: 'custom', name: 'Personalizado' }
]

export const promo_mode = [
  { key: 'percentage', name: 'Porcentaje' },
  { key: 'fixed', name: 'Fijo' }
]
