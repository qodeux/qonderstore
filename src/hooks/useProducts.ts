import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import supabase from '../lib/supabase'
import { setProducts } from '../store/slices/productsSlice'

export const useProducts = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products_view').select('*')

      if (data) dispatch(setProducts(data))
      if (error) console.error('Error al cargar productos:', error.message)
    }

    fetchProducts()

    // Realtime
    const channel = supabase
      .channel('realtime:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        await fetchProducts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products_unit' }, async () => {
        await fetchProducts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products_bulk' }, async () => {
        await fetchProducts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
