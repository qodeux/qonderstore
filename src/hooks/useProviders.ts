import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import supabase from '../lib/supabase'
import { setProviders, setSupplyOrders } from '../store/slices/providersSlice'

export const useProviders = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchProviders = async () => {
      const { data, error } = await supabase.from('providers_view').select('*')
      if (data) dispatch(setProviders(data))
      if (error) console.error('Error al cargar proveedores:', error.message)
    }

    const fetchSupplyOrders = async () => {
      const { data, error } = await supabase.from('supply_orders').select('*')
      if (data) dispatch(setSupplyOrders(data))
      if (error) console.error('Error al cargar pedidos:', error.message)
    }

    const refreshAll = async () => {
      await Promise.all([fetchProviders(), fetchSupplyOrders()])
    }

    // carga inicial
    refreshAll()

    const realtimeChannel = supabase
      .channel('realtime:ProvidersAndOrders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'providers' }, refreshAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_orders' }, refreshAll)
      .subscribe()

    return () => {
      supabase.removeChannel(realtimeChannel)
    }
  }, [dispatch])
}
