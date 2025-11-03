import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { supplyOrdersService } from '../services/supplyOrdersService'
import { setSupplyOrders } from '../store/slices/supplyOrdersSlice'

export const useSupplyOrders = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Carga inicial
    const fetchData = async () => {
      const { data, error } = await supplyOrdersService.fetchSupplyOrders()

      if (data) dispatch(setSupplyOrders(data))
      if (error) console.error('Error al suministrar orden:', error.message)
    }

    fetchData()

    // Realtime
    const channel = supabase
      .channel('realtime:SupplyOrders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_orders' }, async () => {
        await fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}
