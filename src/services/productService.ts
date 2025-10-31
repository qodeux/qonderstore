import { addToast } from '@heroui/react'
import supabase from '../lib/supabase'
import type { Product } from '../schemas/products.schema'
import type { ProductRpcPayload } from '../schemas/productsPayload.schema'

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
  }
}
