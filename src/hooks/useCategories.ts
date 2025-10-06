import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { setCategories } from '../store/slices/categoriesSlice'

export const useCategories = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories_view').select('*')

      if (data) dispatch(setCategories(data))
      if (error) console.error('Error al cargar categorías:', error.message)
    }

    fetchCategories()

    // Realtime
    const channel = supabase
      .channel('realtime:Categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        await fetchCategories() // <-- recarga todo desde la view
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
