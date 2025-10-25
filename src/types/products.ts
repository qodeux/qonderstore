import type z from 'zod'
import { productBulkInputSchema, productDataInputSchema, productUnitInputSchema } from '../schemas/products.schema'

// Inputs derivados de Zod
export type ProductDataFormValues = z.input<typeof productDataInputSchema>
export type ProductUnitFormValues = z.input<typeof productUnitInputSchema>
export type ProductBulkFormValues = z.input<typeof productBulkInputSchema>

// Unión discriminada
export type UnitDetails = { sale_type: 'unit'; details: ProductUnitFormValues }
export type BulkDetails = { sale_type: 'bulk'; details: ProductBulkFormValues }
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
