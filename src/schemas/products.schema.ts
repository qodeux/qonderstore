import z from 'zod'

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres'),
  sku: z.string().optional(),
  category: z.coerce.number().nonnegative().positive('La categoría es obligatoria'),
  //price: z.number().min(0, 'El precio no puede ser negativo'),
  type_unit: z.enum(['unit', 'bulk'], {
    message: 'La unidad de venta es obligatoria'
  }),
  //stock: z.number().min(0, 'El stock no puede ser negativo'),
  description: z.string().optional(),
  tags: z.string().optional(),
  featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  brand: z.string().optional()
  //images: z.array(z.string().url('Cada imagen debe ser una URL válida')).optional()
})
export type ProductFormData = z.infer<typeof productSchema>

export const productUnitSchema = z.object({
  sale_unit: z.enum(['pz', 'pk', 'box'], {
    message: 'La unidad de venta es obligatoria'
  }),
  base_cost: z.coerce.number('Ingresa un número válido').min(0, 'El costo base no puede ser negativo'),
  public_price: z.coerce.number('Ingresa un número válido').min(0, 'El precio no puede ser negativo')
})

export type ProductUnitFormData = z.infer<typeof productUnitSchema>
