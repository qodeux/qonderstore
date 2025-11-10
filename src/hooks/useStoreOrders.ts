import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { storeOrderService } from '../services/storeOrderService'
import { setStoreOrders } from '../store/slices/storeOrdersSlice'

export const useStoreOrders = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchData = async () => {
      const { data, error } = await storeOrderService.fetchStoreOrders()

      if (data) dispatch(setStoreOrders(data))
      if (error) console.error('Error al cargar ordenes:', error.message)
    }

    fetchData()

    // Realtime
    const channel = supabase
      .channel('realtime:StoreOrders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_orders' }, async () => {
        await fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
