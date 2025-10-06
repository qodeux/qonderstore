import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { setProductBrands } from '../store/slices/productsSlice'

export const useProductBrands = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchProductBrands = async () => {
      const { data, error } = await supabase.from('product_brands').select('*')

      if (data) dispatch(setProductBrands(data))
      if (error) console.error('Error al cargar marcas de productos:', error.message)
    }

    fetchProductBrands()

    // Realtime
    const channel = supabase
      .channel('realtime:ProductBrands')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_brands' }, async () => {
        await fetchProductBrands() // <-- recarga todo desde la view
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
