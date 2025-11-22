import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { productService } from '../services/productService'
import { userService } from '../services/userService'
import { setProductRatings } from '../store/slices/productsSlice'
import { setProductRatings as setProductUserRatings } from '../store/slices/usersSlice'

type UseProductRatingsParams = {
  productId?: number
  userId?: string
}
export const useProductRatings = ({ productId = undefined, userId = undefined }: UseProductRatingsParams) => {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchProductRatings = async (productId: number) => {
      const { data, error } = await productService.fetchProductRatings(productId)

      if (data) dispatch(setProductRatings(data))
      if (error) console.error('Error al cargar marcas de productos:', error.message)
    }
    const fetchUserRatings = async (userId: string) => {
      const { data, error } = await userService.fetchUserProductRatings(userId)

      if (data) dispatch(setProductUserRatings(data))
      if (error) console.error('Error al cargar marcas de productos:', error.message)
    }

    if (productId) fetchProductRatings(productId)

    if (userId) fetchUserRatings(userId)

    const channel = supabase
      .channel('realtime:ProductBrands')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_ratings' }, async () => {
        if (productId) await fetchProductRatings(productId)
        if (userId) await fetchUserRatings(userId)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch, productId, userId])
}
