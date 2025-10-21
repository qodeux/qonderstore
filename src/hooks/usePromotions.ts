import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { setPromotions } from '../store/slices/promoSlice'

export const usePromotions = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchPromotions = async () => {
      const { data, error } = await supabase.from('promos').select('*')

      if (data) dispatch(setPromotions(data))
      if (error) console.error('Error al cargar promociones:', error.message)
    }

    fetchPromotions()

    // Realtime
    const channel = supabase
      .channel('realtime:Promotions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promos' }, async () => {
        await fetchPromotions()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
