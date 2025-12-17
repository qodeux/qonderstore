import type { ProductBulkInput, ProductUnitInput } from '../schemas/products.schema'

// Unión discriminada
export type UnitDetails = { sale_type: 'unit'; details: ProductUnitInput }
export type BulkDetails = { sale_type: 'bulk'; details: ProductBulkInput }
export type ProductDetails = UnitDetails | BulkDetails

export const bulkUnitsAvailable = [
  { label: 'Gramo', key: 'gr', value: 1 },
  { label: 'Onza', key: 'oz', value: 28.3495 },
  { label: 'Libra', key: 'lb', value: 453.592 }
] as const
export type BulkUnit = (typeof bulkUnitsAvailable)[number]['key']

export const saleTypes = [
  { label: 'Unidad', key: 'unit' },
  { label: 'Granel', key: 'bulk' }
]
export type SaleType = (typeof saleTypes)[number]['key']

export const saleUnitsAvailable = [
  { label: 'Pieza', key: 'pz' },
  { label: 'Paquete', key: 'pk' },
  { label: 'Caja', key: 'box' }
]

export type SaleUnit = (typeof saleUnitsAvailable)[number]['key']

export type BulkDbUnits = Record<
  string,
  {
    price: number | undefined
    margin: number | undefined
  }
>

export type DbUnitDetails = {
  unit: 'pz' | 'pk' | 'box'
  base_cost: number | null
  public_price: number
  low_stock: number | null
  min_sale: number | null
  max_sale: number | null
  wholesale_prices: { min: number; price: number }[] | null
}

export type DbBulkDetails = {
  bulk_units_available: string[] | null
  base_unit: string | null
  base_unit_price: number | string | null
  units: BulkDbUnits | null
  stock: number | null
  min_sale: number | null
  max_sale: number | null
  wholesale_prices: Record<string, { min: number; price: number; total_price: number }[]> | null
}

export type RawUnitEntry = {
  key?: string
  id?: string
  code?: string
  label?: string
  price?: number | string | null
  margin?: number | string | null
}
