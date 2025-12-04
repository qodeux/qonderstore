import { addToast } from '@heroui/react'
import supabase from '../lib/supabase'
import type { BrandInput } from '../schemas/brand.schema'
import type { InventoryAdjustmentInput } from '../schemas/inventoryAdjusment.schema'
import type { Product } from '../schemas/products.schema'
import type { ProductRpcPayload } from '../schemas/productsPayload.schema'
import { bulkUnitsAvailable } from '../types/products'

export const productService = {
  fetchProducts: async () => {
    const { data: products, error } = await supabase.from('products_view').select('*')
    if (error) {
      console.error('Error fetching products:', error)
    }
    return products
  },
  fetchProductDetails: async (product: Product) => {
    const table = product.sale_type === 'unit' ? 'products_unit' : 'products_bulk'

    const { data: productDetails, error } = await supabase.from(table).select('*').eq('product_id', product.id).single()
    if (error) {
      console.error('Error fetching product details:', error)
    }
    return productDetails
  },
  createProduct: async (payload: ProductRpcPayload) => {
    console.log('Creating product with payload:', payload)
    const { data, error } = await supabase.rpc('rpc_create_product', {
      payload
    })

    if (error) {
      console.error('Error inserting product:', error)
      throw error
    }

    addToast({
      title: 'Producto agregado',
      description: `El producto "${data.product.name}" ha sido agregado correctamente.`,
      color: 'success',
      variant: 'bordered',
      shouldShowTimeoutProgress: true
    })

    return { data }
  },
  updateProduct: async (id: number, payload: ProductRpcPayload) => {
    console.log('Updating product with id:', id, payload)

    const { data, error } = await supabase.rpc('rpc_update_product', {
      p_id: id,
      payload
    })

    if (error) {
      console.error('Error updating product:', error)
      throw error
    }

    addToast({
      title: 'Producto actualizado',
      description: `El producto "${data.product.name}" ha sido actualizado correctamente.`,
      color: 'primary',
      variant: 'bordered',
      timeout: 4000,
      shouldShowTimeoutProgress: true
    })

    return { data }
  },

  deleteProduct: async (productId: string) => {
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) {
      console.error('Error deleting product:', error)
    }
  },
  createBrand: async (payload: BrandInput) => {
    const { data, error } = await supabase.from('product_brands').insert(payload).select().single()
    if (error) {
      console.error('Error adding brand:', error)
      throw error
    }

    addToast({
      title: 'Marca agregado',
      description: `La marca "${data.name}" ha sido agregado correctamente.`,
      color: 'success',
      variant: 'bordered',
      shouldShowTimeoutProgress: true
    })

    return data
  },
  fetchBrands: async () => {
    const { data, error } = await supabase.from('product_brands_view').select('*')
    if (error) {
      console.error('Error fetching brands:', error)
      return { error }
    }
    return { data }
  },
  updateBrand: async (payload: BrandInput) => {
    const updatePayload = { ...payload, color: payload.color ?? null }
    const { data, error } = await supabase.from('product_brands').update(updatePayload).eq('id', payload.id).select().single()
    if (error) {
      console.error('Error updating brand:', error)
      throw error
    }

    addToast({
      title: 'Marca actualizado',
      description: `La marca "${data.name}" ha sido actualizado correctamente.`,
      color: 'primary',
      variant: 'bordered',
      timeout: 4000,
      shouldShowTimeoutProgress: true
    })

    return data
  },
  deleteBrand: async (id: number) => {
    const { error } = await supabase.from('product_brands').delete().eq('id', id)
    if (error) {
      console.error('Error deleting brand:', error)
      return { error }
    }
  },
  inventoryAdjustment: async (product: Product, userId: string, payload: InventoryAdjustmentInput) => {
    let adjustedPayload
    if (product.sale_type === 'unit') {
      adjustedPayload = {
        quantity: payload.quantity,
        type: 'unit',
        comment: payload.comment ?? null
      }
    }

    if (product.sale_type === 'bulk') {
      const base = bulkUnitsAvailable.map((u) => u.key)
      const bulkUnits = Array.from(new Set([...base, { label: 'Kilogramos', key: 'kg', value: 1000 }.key]))

      const quantityInGrams = (() => {
        if (!bulkUnits.includes(payload.unit)) {
          throw new Error(`Unidad inválida para producto a granel: ${payload.unit}`)
        }
        switch (payload.unit) {
          case 'gr':
            return payload.quantity
          case 'kg':
            return payload.quantity * 1000
          case 'oz':
            return payload.quantity * 28.3495
          case 'lb':
            return payload.quantity * 453.592
        }
      })()

      adjustedPayload = {
        quantity: quantityInGrams,
        type: 'bulk',
        comment: payload.comment ?? null
      }
    }

    // console.log({
    //   p_product_id: product.id,
    //   p_user_id: userId,
    //   p_payload: adjustedPayload
    // })

    const { data, error } = await supabase.rpc('update_product_stock', {
      p_product_id: product.id,
      p_user_id: userId,
      p_payload: adjustedPayload
    })

    console.log(data)

    if (error) {
      console.error('Error adjusting inventory:', error)
      throw error
    }
    return data
  },
  fetchProductRatings: async (productId: number) => {
    //console.log(productId)
    const { data, error } = await supabase
      .from('product_ratings')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching product ratings:', error)
      return { error }
    }
    return { data }
  }
}
